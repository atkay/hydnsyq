if (Meteor.is_client) {
	Messages = new Meteor.Collection("messages");
	Session.set("coords", "Aquiring GPS Signal, please wait....");
	Session.set("lat", "0");
	Session.set("lon", "0");
	Session.set("yourlink", "?");
	Session.set("gpsAccuracy","1000");
	Session.set("errormessage","");
	Template.main.get = function() {
		if (window.location.pathname.length>2) {
			return true;
		} else {
			return false;
		}
	};

	Template.main.coords = function() {
		if (Modernizr.geolocation) {
		      // timeout at 300,000 milliseconds (5 minuites)
            		var options = {timeout:300000, maximumAge:1000, enableHighAccuracy:true};
            		navigator.geolocation.watchPosition(setcoords, geo_error, options);
		}else
        {
            Session.set("coords","GPS cannot be used with your device");
        }
		return Session.get("coords");
	};

	function geo_error(error)
	{
		switch(error.code)
		{
			case error.TIMEOUT:
				Session.set("errormessage","Error: GPS timed out");
				break;
			case error.POSITION_UNAVAILABLE:
				Session.set("errormessage","Error: The position of the device could not be determined");
				break;
		}
	}	

	function setcoords(position) {
	    var lon = position.coords.longitude.toFixed(4);
		var lat = position.coords.latitude.toFixed(4);
		var accuracy = position.coords.accuracy;
		Session.set("lat", lat);
		Session.set("lon", lon);
		Session.set("gpsAccuracy",accuracy);
		if(accuracy > 50)
		{
			Session.set("coords", "Latitude: "+lat+", Longitude: "+lon+", Accuracy: "+accuracy+"m, GPS accuracy too low for encryption");

		}else{
			Session.set("coords", "Latitude: "+lat+", Longitude: "+lon+", Accuracy: "+accuracy+"m");

		}
	}
	Template.set.yourlink = function() {
		return "/"+Session.get("yourlink");
	};

	Template.get.ciphertext = function() {
		var text = unescape(window.location.pathname);
		text = text.substr(1, text.length-1);
		Session.set("ciphertext", text);
		return Session.get("ciphertext");
	};
	Template.get.plaintext = function() {
		return decrypt(Session.get("ciphertext"));
	};
	
	Template.main.errormessage = function(){
		return Session.get("errormessage");
	};

	function encrypt(string) {
		var lat = Session.get("lat");
		var lon = Session.get("lon");
		var accuracy = Session.get("gpsAccuracy");
		return crypt(string, [lat, lon], false);
	}
	function decrypt(string) {
		var lat = Session.get("lat");
		var lon = Session.get("lon");
		var accuracy = Session.get("gpsAccuracy");
		return crypt(string, [lat, lon], true);
	}
	function crypt(string, coords, decrypt) {
		var words = string.split(" ");
		var output = "";
		var coord = 0;
		for (word in words) {
			var output_word = "";
			var word = words[word];
			var letters = word.split('');
			var i = 1;
			var this_coord = coords[coord];
			if (coord<1) {
				coord += 1;
			} else {
				coord = 0;
			} 
			for (letter in letters) {
				var this_key = parseInt(this_coord.charAt(this_coord.length - i));
				if (i<4) {
					i += 1;
				} else {
					i = 1;
				}
				if (decrypt===true) {
					this_key = 26 - this_key;
				};
				var letter = letters[letter];	
				var charcode = letter.charCodeAt(0);
					
				if (charcode >= 65 && charcode <= 90) {
					var charc = String.fromCharCode((charcode - 65 + this_key) % 26 + 65);
					output_word += charc;
				}
				else if (charcode >= 97 && charcode <= 122) {
					var charc = String.fromCharCode((charcode - 97 + this_key) % 26 + 97);
					output_word += charc;
				} else {
					var charc = letter;
					output_word += charc;
				}
			}
			output += output_word+" ";
		}
		return output;
	}
	Template.set.events = {
		'submit #set-message': function(){		
			var text = document.getElementById("set-message-text");
			var ciphertext = encrypt(text.value);
			var escaped = escape(ciphertext);
			var accuracy = Session.get("gpsAccuracy");
			Session.set("yourlink", escaped);
			if(accuracy < 50)
			{
				window.location = escaped;
			}else{
				Session.set("errormessage","Error: Cannot encrypt, GPS accuracy too low.");
			}
			event.preventDefault ? event.preventDefault() : event.returnValue = false;
			
		}/*,
		'keyup #set-message-text': function() {
			if(Modernizr.history)
			{			
				var text = document.getElementById("set-message-text");
				var ciphertext = encrypt(text.value);
				var escaped = escape(ciphertext);
				Session.set("yourlink", escaped);
				history.pushState(null, null, "/"+escaped);
	  			event.preventDefault ? event.preventDefault() : event.returnValue = false;
		    		event.stopPropagation();
			}
		}*/
	};
	Template.set.savedmessages = function() {
		return Messages.find();
	};

}

if (Meteor.is_server) {
	Meteor.startup(function () {
		Messages = new Meteor.Collection("messages");
	});
}
