/**
   Overload javascript alert
   @param {string} message Message string 
   @param {function} callback Callback function
   @param {string} title Title of message
   @param {string} buttonname Name of button
   
*/
alert = function(message, callback, title, buttonname) {
	if (!title) title = 'InstaTrace';
	navigator.notification.alert(message, callback, title, t('ok'));
};

/**
   Overload javascript confirm
   @param {string} message Message string 
   @param {function} callback Callback function
   @param {string} title Title of confirm
   @param {string} buttonLabels Name of buttons
*/
confirm = function(message, callback, title, buttonLabels) {
	if (!title) title = 'InstaTrace';
	navigator.notification.confirm(message, callback, title, t('ok') + ',' + t('cancel'));
};

var views = [
	'page-lang',
	'page-agree',
	'page-profile',
	'page-home',
	'page-ship-det',
	'page-details',
	'page-driver-act',
	'page-damage-info',
	'page-image-box',
    'page-album',
	'page-photo-preview',
	'page-signature',
	'page-image-doc',
	'page-complete',
	'page-final'
];

/**
   Show page
   @param {string} view Name of page.
*/
function show(view) {
	for (var i in views) {
		$("."+views[i]).fadeOut(0);
	}

	if (view) {
		active_page = view;
		if (view == "page-agree") {
			load_page_agree(); 
		}
		if (view == "page-signature") load_signature();
		if (view == "page-driver-act") load_actions();
		if (view == "page-photo-preview") load_photo_preview();
		if (view == "page-details") prepare_page_details();

		if (view == 'paeg-photo-preview' || view == 'page-image-box' ||
			view == 'page-image-doc') {
		}
		if (view == "page-ship-det") {
			load_ship_det();
			getcurentposition();
		}
		
		if (view == "page-album") {
			load_album();
		}
		
		resize();
		window.scrollTo(0, 0);
		$("."+view).fadeIn("fast");
	}
}
/**
   Send request to server
   @param {string} url Url address
   @param {string} type Type of request (get,post)
   @param {array} data List of parameters
   @param {function} success (optional) Success callback
   @param {function} fail (optional) Fail callback
   @param {bool} async (optional) asynchronous flag
*/

function send_request(url, type, data, success, fail, async, background) {
	if (async == null) async = true;
	if (background == null) background = false;
    $.ajax({
        url: url,
        type: type,
        data: data,
		async: async,
        timeout: 25000
    }).done(function(data) {
        if (typeof(success) == 'function') success(data);
    }).fail(function(error) {
		if (error.status == 401) {
			alert( t('error_not_auth') );
			show('page-profile');
			if (background === true) {
				if (typeof(fail) == 'function') fail(error);
			}
		} else {
			if (error.status == 0) {
				alert( t('error_no_internet') );
			} else {
				if ( check_connection() ) if(typeof(fail) == 'function') fail(error);
			}
		}
    }).complete(function(jqXHR, textStatus) {
        var response = JSON.stringify(jqXHR);
        console.log(response);
	});
}
/**
	Check internet connection
	@returns {boolean} status of internet connection
*/
function check_connection(warning) {
	if (typeof warning == 'undefined') warning = true;
	if (navigator.network.connection.type == 'none' || 
	 navigator.network.connection.type == 'unknown') {
		if (warning) alert( t('error_no_internet') );
		return false;
	}
	
	return true;
}
/**
	Login driver
*/
function login() {
	$(".page-profile button").attr("disabled", true);
    
	var data = {
        code: $('#activation_code').val()
    };
    
	send_request(url + 'api/activation', 'POST', data,
        function(data) {
            token = data.token;
            window.localStorage.setItem("authToken", token);
            show('page-home');
			$(".page-profile button").removeAttr("disabled");
			getcurentposition();
			worker_start();
        },
        function(data) {
            alert( t('error_activation') );
			$(".page-profile button").removeAttr("disabled");
        }
    );
}
/**
	Get shipment details
*/
function get_shipment_details() {
    var data = {
        token: token,
		shipment_id: $('#id-shipment-value').val()
    };
	
	if ( data.shipment_id == '') {
	  alert( t('error_no_ship_id') );
	  return;
	}
	worker_start();
    
    send_request(url + 'api/shipment','POST', data,
        function(data) {
			current_shipment.shipment = data.hawb;
			current_shipment.timezone = new Date().getTimezoneOffset();
			current_shipment.milestone = new Object();
            fill_shipment_data(data);
            show('page-ship-det');
			getcurentposition();
        },
        function(data) {
            alert( t('error_shipment_id') );
        }
    );
}

/**
	Fill page 'shipment details'
	@param {object} shipment
*/
function fill_shipment_data(shipment) {
	$('.page-ship-det .info-block .ib-value').html(shipment.hawb);
	$('#shipment-details-form .num_of_pieces .input-value').html( accounting.formatNumber(shipment.pieces, 0, ',', '.') );
	$('#shipment-details-form .total_weight .input-value').html( accounting.formatNumber(shipment.weight, 0, ',', '.') );
	$('#shipment-details-form .pick_up .input-value').html(shipment.pick_up);
	$('#shipment-details-form .destination .input-value').html(shipment.destination);
	$('.page-ship-det #shipment-details-form #action-select .link-more').html(t('shipment_select'));
	$('#shipment-details-form .damage #checbox').attr('checked', true);
}

/**
	Submit signature 
*/
function signature_submit() {
	if( $('.page-signature input#name').val() == '' ) {
		alert( t('error_no_name') );
		return false;
	}
	if ( !ValidateEmail() ) return false;
	

	var signature;
	if (device.platform && device.platform == 'Android' &&
		device.version && device.version.match(/^2[\.\d]*$/) != null ) {
		var canvas = document.getElementById('canvas');
		signature = Canvas2Image.saveAsBMP(canvas, true);
		console.log( signature );
	} else {
		 signature = api.getSignatureImage();
	}

	current_shipment.signature = new Object();
	current_shipment.signature.signature =  signature;
	current_shipment.signature.name  = $('.page-signature input#name').val();
	current_shipment.signature.email = $('.page-signature input#email').val();
	if (current_shipment.signature.email != '') {
		cache_email(current_shipment.signature.email);
	}
	
	check_go_image_pod();
	return false;
}
/**
	Check damage checkbox and go to next page 	
*/
function shipment_submit() {
	if(action == undefined || action == '') {
		alert( t('error_action_required') );
		return false;
	}
	$('.page-ship-det button').attr('disabled', true);
	if( $('#shipment-details-form .damage #checbox').is(':checked') ) {
		if(typeof current_shipment.milestone.damaged != 'undefined') {
			delete current_shipment.milestone.damaged;
		}
		show('page-image-box');
	} else {
		current_shipment.milestone.damaged = 1;
		show('page-damage-info');
	}
	$('.page-ship-det button').removeAttr('disabled');
}
function check_coordinates() {
	if (latitude == undefined || longitude == undefined) {
		alert( t('error_gps') );
		return false;
	}
	return true;
}
/**
	Complete shipment
*/
function complete_submit() {
  getcurentposition();
	if ( !check_coordinates() ) return;

	current_shipment.milestone.latitude = latitude;
	current_shipment.milestone.longitude = longitude;
	current_shipment.milestone.completed = 1;
	reset_image_box();
	send_or_save_ship();

	show('page-final');
}

/**
	Prepare and show driver actions page
*/
function show_driver_act() {
	if(action == 'pick-up') 
		$('.page-driver-act .main-form #f1').attr('checked', true);
	else $('.page-driver-act .main-form #f1').attr('checked', false);
	
	if(action == 'back_at_base')
		$('.page-driver-act .main-form #f2').attr('checked', true);
	else $('.page-driver-act .main-form #f2').attr('checked', false);
	
	if(action == 'en_route_to_carrier')
		$('.page-driver-act .main-form #f3').attr('checked', true);
	else $('.page-driver-act .main-form #f3').attr('checked', false);
	
	if(action == 'tendered_to_carrier')
	    $('.page-driver-act .main-form #f4').attr('checked', true);
	else $('.page-driver-act .main-form #f4').attr('checked', false);

	if(action == 'recovered_from_carrier')
		$('.page-driver-act .main-form #f5').attr('checked', true);
	else $('.page-driver-act .main-form #f5').attr('checked', false);

	if(action == 'out_for_delivery')
		$('.page-driver-act .main-form #f6').attr('checked', true);
	else $('.page-driver-act .main-form #f6').attr('checked', false);

	if(action == 'delivered')
		$('.page-driver-act .main-form #f7').attr('checked', true);
	else $('.page-driver-act .main-form #f7').attr('checked', false);

	show('page-driver-act');
}
/**
	Check driver action
*/
function change_driver_act() {
	var title ='';
	if( $('.page-driver-act .main-form #f1').attr('checked') ) {
		title = t('action_pick_up');
		action = 'pick-up';
	}

	if( $('.page-driver-act .main-form #f2').attr('checked') ) {
		title= t('action_back_at_base');
		action = 'back_at_base';
	}

	if( $('.page-driver-act .main-form #f3').attr('checked') ) {
		title = t('action_route_carrier');
		action = 'en_route_to_carrier';
	}

	if( $('.page-driver-act .main-form #f4').attr('checked') ) {
		title = t('action_tendered_carrier');
		action = 'tendered_to_carrier';
	}

	if( $('.page-driver-act .main-form #f5').attr('checked') ) {
		title = t('action_recovered_carrier');
		action = 'recovered_from_carrier';
	}

	if( $('.page-driver-act .main-form #f6').attr('checked') ) {
		title = t('action_out');
		action = 'out_for_delivery';
	}

	if( $('.page-driver-act .main-form #f7').attr('checked') ) {
		title = t('action_delivery');
		action = 'delivered';
	}

	if(!action || action == '') {
		alert( t('error_action_submit') );
		return;
	}

	$('.page-ship-det #shipment-details-form #action-select .link-more').html(title);
	current_shipment.milestone.action = action;

	show('page-ship-det');
}
/**
	Go to home page
*/
function go_home() {
	confirm( t('confirm_go_home'), function(ch) {
	if (ch == 1) {
		$("button.icon-home").attr("disabled", true);

		var shipment = {
			shipment_id: '',
			pieces: '',
			weight: '',
			pick_up: '',
			destination: '',
			damaged: false
		};

		fill_shipment_data(shipment);

		action ='';
		$('#damage_info').val('');
		$('#id-shipment-value').val('');
		reset_image_box();
		reset_image_pod();
		reset_signature();
		current_shipment.length = 0;
		ship_info.length = 0;
		instruction.length = 0;
		dimensions = '';
		name = '';
		dest_phone = '';
		clear_current();

		show('page-home');
		$("button.icon-home").removeAttr("disabled");
	}}, t('confirm_go_home_title') ); 
}

var upload_params;
/**
        Prepare params for upload shipment
*/
function prepare_params()
{
	var data = {
		token: token,
		lat: latitude,
		lon: longitude,
		damage: $('#damage_info').val()
	};

	if(action != undefined && action != '') data.driver_action = action;
	if( $('#shipment-details-form .damage #checbox').is(':checked') ) {
		data.damaged = 0;
	} else {
		data.damaged = 1;
	}
	upload_params = data;
}

/**
	Submit shipment
*/
function send_shipment_info() {
	if(box_photos.length > 0) {
        show('page-album');
    } else {
		check_go_signature();
	}
}
/** 
	Get current Gps coordinates
*/
function getcurentposition() {
	navigator.geolocation.getCurrentPosition(GeoOnSuccess, GeoOnError, {enableHighAccuracy: true});
}
/**
	Success getting gps coordinates
*/
function GeoOnSuccess(position) {
	latitude = position.coords.latitude;
	longitude = position.coords.longitude;
}
/**
	Failed getting gps coordinates
*/
function GeoOnError(error) {
	// Do nothing
}
/**
	Check and go to page "signature", if necessary 
*/
function check_go_signature() {
	if(action == 'pick-up' || action == 'delivered') {
		show('page-signature');
	} else {
		check_go_image_pod();
	}
}
/** 
	Check and go to page "capture document photo", if necessary
*/
function check_go_image_pod() {
	if(action == 'delivered' || action == 'tendered_to_carrier' ||
			action == 'recovered_from_carrier') {
		show('page-image-doc');
	} else {
		show('page-complete');
	}
}
/**
	Submit document photo
*/
function send_pod() {
	if(pod_photo != undefined && pod_photo != '') {
		current_shipment.document = new Object();
		current_shipment.document.doc_type = 'pod';
		current_shipment.document.name = pod_photo;

		show('page-complete');
		reset_image_pod();
	} else {
		show('page-complete');
	}
}
/**
        Success upload document photo
*/
function sendpodSuccess(data) {
	show('page-complete');
	$(".page-image-doc button").removeAttr("disabled");
	reset_image_pod();
}

/**
	Prepare to start next shipment
*/
function next_shipment() {
	show('page-home');
	reset_image_box();
	reset_image_pod();
	reset_signature();
	action = '';
    $('#damage_info').val('');
    $('#id-shipment-value').val('');
	ship_info.length = 0;
	instruction.length = 0;
	dimensions = '';
	name = '';
	dest_phone = '';
	clear_current();
}
/**
	Reset "Capture image box" page
*/
function reset_image_box() {
	box_photos = new Array();
	var image = document.getElementById('imagebox');
	image.src = '';
	image.style.visibility = "hidden";
	$('#photos-small img').remove();
	$('#photos-small-second img').remove();
	$('#album_wrapper div').remove();
}
/**
	Reset "Capture document" page
*/
function reset_image_pod() {
	pod_photo = '';
	var image = document.getElementById('imagepod');
	image.src = '';
	image.style.visibility = "hidden";
}
/**
	Reset "Signature" page
*/
function reset_signature() {
	api.clearCanvas();
	$('.page-signature input#name').val('');
	$('.page-signature input#email').val('');
}
	
/**
	Prepare photos to upload
*/
function clear_photos_array() {
	var result = [];
	for (var i =0; i< box_photos.length; i++) {
		if(box_photos[i] == null) continue;
		result.push(box_photos[i]);
	}

	box_photos = result;
}

/**
	Transfer from "Damage info" page
*/
function damageinfo_submit() {
	current_shipment.damage = $('#damage_info').val();
	show('page-image-box');
}

/**
	Go back from Complete page
*/
function back_from_complete() {
	if(action == 'delivered' || action == 'tendered_to_carrier' ||
				action == 'recovered_from_carrier') {
		show('page-image-doc');
	} else {
		if(action == 'pick-up') {
			show('page-signature');
		} else {
			show('page-album');
		}
	}
}

/**
	Go back from "Capture document" page
*/
function back_from_image_doc() {
	if(action == 'delivered' || action == 'pick-up') {
		show('page-signature');
	} else {
		show('page-album');
	}
}

$('#photos-small img').live('click', function() {
	var image = document.getElementById('imagebox');
	image.src = this.src;
});

$('#photos-small-second img').live('click', function() {
	var image = document.getElementById('imagebox');
	image.src = this.src;
});

/**
	Update album
*/
function update_album()  {
    $('#album_wrapper > div').remove();
    for(var i in box_photos) {
		if(box_photos[i] == undefined || box_photos[i] == null) continue;
        var div = document.createElement("div"); 
        div.className = 'photo';
		div.style.display = 'block';
		div.style.height = '80px';
		div.style.width = '80px';
    
        var img = new Image();
        img.src = "data:image/jpeg;base64," + box_photos[i];
        img.id = "photo_" + i;
		img.className = "photo_in_album";

        var del = document.createElement("a");
        del.className = "del";
        del.id = i;
		del.href = "#";
    
        div.appendChild(img);
        div.appendChild(del);
        var album = document.getElementById('album_wrapper');
		album.appendChild(div);
	}
	$('.photo_in_album').each(function() {
   		$(this).click(function(e) {
   			var image = document.getElementById('photo-preview');
			image.src = this.src;
			show('page-photo-preview');
		});
	});
		
	$('#album_wrapper a.del').each(function() {
		$(this).click(function(event) {
			var self = this;
			confirm( t("delete_confirm"), function(ch) {
		        if (ch == 1) {
		            $("#photo_"+self.id).remove();
		            delete box_photos[self.id];
		            $(self).parent().remove();
		        }
		    });
		});
	});
}


/**
	Submit album
*/
function album_submit() {
	clear_photos_array();
	current_shipment.damage_photo = box_photos;
	check_go_signature();
}

/**
	Function is called when the body is resized
*/
function resize() {
  if (active_page == 'page-agree') {
  	$('#scroller').css({height: window.innerHeight - 130 + 'px'});
  }
  if (active_page == 'page-signature') {
    var sig = api.getSignature();
    api.regenerate(sig);
    if ( $('#email').is(':focus') ) {
    	$('.fixed').css('width', window.innerWidth + 'px');
    	$('#email').autocomplete("close").autocomplete("search");
    }
    $('.page-signature #header').css({width: window.innerWidth + 'px'});
  }
  if (active_page == 'page-image-doc') {
    $('.page-image-doc .table').css({height: window.innerHeight});
  	$('#imagepod').css('max-height', window.innerHeight + 'px');
  } 
  if (active_page == 'page-image-box') {
  	$('.page-image-box .table').css({height: window.innerHeight});
  	$('#imagebox').css('max-height', window.innerHeight + 'px');
  }
  
  if (active_page == 'page-photo-preview' || 
  	active_page == 'page-album') {
  	  $('.table').css({'height': window.innerHeight -44 + 'px'});
	  $('#photo-preview').css({
                             'max-height': window.innerHeight - 44 + 'px',
                             'max-width': window.innerWidth + 'px'
	  });
	  $('.page-photo-preview #header').css('width', window.innerWidth + 'px');
	  $('.page-album #header').css({width: window.innerWidth + 'px'});
  }
  if (active_page == 'page-ship-det') {
  	$('.page-ship-det #header').css('width', window.innerWidth + 'px');
  }
  if (active_page == 'page-driver-act') {
  	$('.page-driver-act #header').css('width', window.innerWidth + 'px');
  }
  if (active_page == 'page-complete') {
  	$('.page-complete #header').css('width', window.innerWidth + 'px');
  }
}

/**
	Check email address
	@param {string} email
	@returns {boolean} status
*/
function echeck(str) {
		var at = "@";
		var dot = ".";
		var lat = str.indexOf(at);
		var lstr = str.length;
		var ldot = str.indexOf(dot);
		
		if (str.indexOf(at) == -1) return false;
		if (str.indexOf(at) == -1 || str.indexOf(at)==0 || str.indexOf(at) == lstr) return false;
		if (str.indexOf(dot) == -1 || str.indexOf(dot)==0 || str.indexOf(dot) == lstr) return false;
		if (str.indexOf(at, (lat+1)) != -1) return false;
		if (str.substring(lat-1, lat) == dot || str.substring(lat+1, lat+2) == dot) return false;
		if (str.indexOf(dot, (lat+2)) == -1) return false;
		if (str.indexOf(" ") != -1) return false;

 		return true;
}

/**
	Validate email
	@returns {boolean} status
*/
function ValidateEmail() {
	var email = document.getElementById("email");
	if ((email.value != null) && (email.value != "") &&
			(email.value != undefined)) {
		if ( echeck(email.value) == false ) {
			alert( t("error_invalid_email") );
			email.focus();
			return false;
		}
	}
	return true;
 }

function get_cached_emails() {
	emails = window.localStorage.getItem('emails');
	if (emails) {
		emails = JSON.parse(emails);
	} else {
		emails = [];
	}
}

function cache_email(email) {
	get_cached_emails();

	if ( jQuery.inArray(email, emails) == -1) {
		if (emails.length < 50) {
			emails.push(email);
		} else {
			emails.shift();
			emails.push(email);
		}
	}
	window.localStorage.setItem('emails', JSON.stringify(emails));

}

function prepare_page_details() {
	var html = '';
	
	if(name && name != '')
		html += '<li class="listview-item ship-details">' + t("name") + ': ' + name + '</li>';
	if(dest_phone && dest_phone != '')
		html += '<li class="listview-item ship-details">' + t("dest_phone") + ': ' + dest_phone + '</li>';
	if(dimensions && dimensions != '') 
		html += '<li class="listview-item ship-details">' + t("dimensions") + ': ' + dimensions + '</li>';

	for (var i = 0; i < ship_info.length; i++) {
		html += '<li class="listview-item ship-details">' + ship_info[i] + '</li>';
	}

	for (var i = 0; i < instruction.length; i++) {
		html += '<li class="listview-item ship-details">' + instruction[i] + '</li>';	
	}
	if (html == '') html = '<li class="listview-item ship-details">' + t('no_have_any_details') + '</li>';
	
	$('.page-details #details-list').html(html);
	
	if(detailsScroll == undefined) {
		//detailsScroll = new iScroll("detailsScroll");
	}
}

function worker_start() {
	if (worker_status) {
		window.plugins.geolocation.stopGettingLocation(function(){}, function(){});
	}
	
	worker_status = true;
	window.plugins.geolocation.startGettingLocation(token, function(data){console.log(JSON.stringify(data))}, function(data){console.log(JSON.stringify(data))});
}

function worker_stop() {
	if (worker_status) {
		worker_status = false;
		window.plugins.geolocation.stopGettingLocation(function(){}, function(){});
	}
}

$(document).ready(function(){
	$('#sigPad').submit(function(event) {
		event.preventDefault();
		signature_submit();
	});
	
	$('#name').keypress(function(event) {
		if(event.which == 13) {
			event.preventDefault();
			signature_submit();
		}
	});
	
	$('#email').keypress(function(event) {
		if(event.which == 13) {
			event.preventDefault();
			signature_submit();
		}
	});
});