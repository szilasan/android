/**
	Success make photo of box
*/
function boxSuccess(imageData){
	var image = document.getElementById('imagebox');
	image.style.display = 'block';
	image.src = "data:image/jpeg;base64,"+imageData;
    image.style.visibility = "visible";
	box_photos.push(imageData);
    update_album();
}
/**
	Success make photo of document
*/
function podSuccess(image) {
	var imag = document.getElementById("imagepod");
	pod_photo = image;
	imag.style.visibility = "visible";
	imag.src = "data:image/jpeg;base64," + image;
}
/**
	Сallback if could not take photo
*/
function cameraError(message) {
	//Do nothing
}
/**
	Calling native interface for make photo
	@param {integer} type Type of photo (1 - Box photo, 2 - Document photo).
*/
function make_photo(type) {
	if(type == 1) {
	  navigator.camera.getPicture( boxSuccess, cameraError, {
		quality: 25,
		targetWidth:640,
		targetHeight:480,
		destinationType: navigator.camera.DestinationType.DATA_URL,
		encodingType: navigator.camera.EncodingType.JPEG,
		correctOrientation: true
      });
	}
	if(type == 2) {
	  navigator.camera.getPicture( podSuccess, cameraError, {
		targetWidth:1024,
		targetHeight:768,
		quality: 25,
		destinationType: navigator.camera.DestinationType.DATA_URL,
		encodingType: navigator.camera.EncodingType.JPEG,
		correctOrientation: true
      });
	}
}
/**
	Calling scan barcode plugin
*/
function scanbarcode()
{
	if(scannerrun) return;
	scannerrun = true;
	window.plugins.barcodeScanner.scan(
		function(result) {
			if (result.cancelled) {
				console.log("the user cancelled the scan");
			} else {
				var res = result.text.replace('^', '');
				if ( res.match(/^\w*$/) ) {
					$('#id-shipment-value').val(res);
				} else {
					parseQRcode(result.text);
				}
			}
			scannerrun = false;
		},
		function(error) {
			scannerrun = false;
		}
	);
}
