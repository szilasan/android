function send_or_save_ship() {
	if( check_connection(false) ) {
		send_shipment();
	} else {
		addShipment(current_shipment);
	}
}

function loadShipments() {
	shipments = window.localStorage.getItem('shipments');
	if (shipments) shipments = JSON.parse(shipments);
	else shipments = [];
}

function saveShipments() {
	window.localStorage.setItem('shipments', JSON.stringify(shipments));
}

function addShipment(item) {
	loadShipments();
	shipments.push(item);
	saveShipments();
}

function deleteShipments() {
	window.localStorage.removeItem('shipments');
}
function sendSavedShipments() {
	if ( !check_connection(false) ) return;
	loadShipments();
	if (shipments.length < 1) return;
	var data = {
		token: token,
		data: JSON.stringify(shipments)
	};
	
	send_request(url+'api/shipment/mass_update', 'POST', data,
		function(data) {
			deleteShipments();
		},
		function(data) {},
		true,
		true
	);
}
function send_shipment() {
	var data = {
		token: token,
		data: JSON.stringify([current_shipment])
	};
    console.log(JSON.stringify(data));
	send_request(url + 'api/shipment/mass_update', 'POST', data,
		function(data) {
            console.log(JSON.stringify(data));
			clear_current();
		},
		function(data) {
            console.log(JSON.stringify(data));
			addShipment(current_shipment);
			clear_current();
		},
		true,
		true
	);

}

/**
	Parse shipment info from qr code
*/
function parse_shipment_type(char) {
	switch(char) {
		case 'A': return 'Refrigerated, perishable item';
		case 'B': return 'Non refrigerated, perishable item';
		case 'C': return 'Sensitive to high and low heat';
		case 'D': return 'Flammable Materials';
		case 'E': return 'Chemicals (non caustic)';
		case 'F': return 'Chemicals (caustic)';
		case 'G': return 'Sensitive to vibration or dropping';
		case 'H': return 'Timely shipment. No delays';
		case 'I': return 'Hazardows Waste';
		case 'J': return 'Non-hazardous Waste';
		case 'K': return 'Biological materials';
		default:  return false;
	}
}
/**
	Parse shipment special instructions from qr code
*/
function parse_shipment_instructions(char) {
	switch(char) {
		case 'A': return 'Signature required';
		case 'B': return 'Signature and proof of identify required';
		case 'C': return 'Lift-gate needed for pickup and delivery';
		case 'D': return 'Fork lift needed for pickup and delivery';
		case 'E': return 'Two people required to handle shipment';
		case 'F': return 'Three people required to handle shipment';
		case 'G': return 'Call to confirm before pickup';
		case 'H': return 'Call to confirm before delivery';
		case 'I': return 'Morning pickup before noon';
		case 'J': return 'Afternoon pickup before 5 PM';
		default:  return false;
	}
}
/**
	Parse QR code
*/
function parseQRcode(text) {
	var params = text.split("|");

	if ( params.length < 6) {
		alert( t('error_shipment_id') ); 
		return false;
	}

	var scac = params[0].replace('^', '');
	var handling_code = params[1];
	name = params[2];
	var dest_address = params[3];
	dest_phone = params[4];
	
	for(var i=0; i<3; i++) {
		var message = parse_shipment_type(handling_code.charAt(i));
		if(message) ship_info.push(message);
	}
	for(var i =3; i< 6; i++) {
		var message = parse_shipment_instructions(handling_code.charAt(i));
		if(message) instruction.push(message);
	}
	
	var ship_params = params[5].split(",");
	dimensions = ship_params[2];
		var shipment = {
			hawb: scac,
			pieces: ship_params[0],
			weight: ship_params[1],
			pick_up: '',
			destination: dest_address,
			damaged: false
		};
		fill_shipment_data(shipment);
		current_shipment.shipment = scac;
		current_shipment.milestone = new Object();
		show('page-ship-det'); 
}

function clear_current() {
	delete current_shipment.damage_photo;
	delete current_shipment.milestone;
	delete current_shipment;
	current_shipment = new Object();
	current_shipment.milestone = new Object();
	current_shipment.damage_photo = new Array();
}
