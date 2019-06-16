const HTTP = new XMLHttpRequest();
const url = './store.py';

var space_canvas = document.querySelector('canvas#space');
var diagram_canvas = document.querySelector('canvas#diagram');
var ctx = space_canvas.getContext("2d");
var dgm_ctx = diagram_canvas.getContext("2d");
var landmark_list = [];
var leftButtonDown = false;
var img_id = space_canvas.getAttribute('data_img_id');
var category = " -- Select Category --";

var landmark_names = {
	'legless':["waist_right", 
		"waist_left", 
		"right_leg_out",
		"crotch",
		"left_leg_out"
	],
	'lower':["waist_right", 
		"waist_left", 
		"right_leg_out",
		"right_leg_in",
		"crotch",
		"left_leg_in",
		"left_leg_out"
	],
	'upper_sleeveless':["collar_left",
		"collar_right",
		"shoulder_right",
		"right_armpit",
		"bottom_right",
		"bottom_left",
		"left_armpit",
		"shoulder_left"
	],
	'upper':["collar_left",
		"collar_right",
		"shoulder_right",
		"right_sleeve_out",
		"right_sleeve_in",
		"right_armpit",
		"bottom_right",
		"bottom_left",
		"left_armpit",
		"left_sleeve_in",
		"left_sleeve_out",
		"shoulder_left"
	],
}

select_box = document.getElementById("category");
for (lmk_name in Object.keys(landmark_names)) {
	option = document.createElement("option");
	option.textContent = Object.keys(landmark_names)[lmk_name];
	option.value = Object.keys(landmark_names)[lmk_name];
	select_box.add(option)
}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function submit_landmarks() {
	username = $("input#username").val();
	lmk_strings = [];
	if (landmark_list.length != landmark_names[category].length) {
		alert("ERROR: Not enough landmarks for that category. \nRight-click to erase. Check the guide at the bottom to see where they should go.");
		return 0;
	}
	for (lmk in landmark_list) {
		lmk_string = "{0}:{1},{2}".format(
			landmark_names[category][lmk], 
			Math.round(landmark_list[lmk].x), 
			Math.round(landmark_list[lmk].y));
		lmk_strings.push(lmk_string);
	}
	landmarks_out = lmk_strings.join(';');
	
	e = $.post("/store", 
		{'img_id': img_id, 'category':category, 'landmarks':landmarks_out, 'username':username},
		function () {location.reload();}
	);
}

function delete_image() {
	e = $.post("/delete", {'img_id':img_id}, function () {location.reload();});
}

function getCursorPos(space_canvas, e) {

	var a, x = 0, y = 0;
	e = e || window.event;
	
	a = space_canvas.getBoundingClientRect();
	
	x = e.pageX - a.left;
	y = e.pageY - a.top;

	x = x - window.pageXOffset;
	y = y - window.pageYOffset;
	return {x : x, y : y};
}

function getScopeCursorPos(space_canvas, e, scope_radius) {

	var a, x = 0, y = 0;
	e = e || window.event;
	
	a = space_canvas.getBoundingClientRect();
	
	x = e.pageX - a.left;
	y = e.pageY - a.top;

	x = x - window.pageXOffset;
	y = y - window.pageYOffset;
	//if (x<scope_radius) { x = scope_radius }
	//if (y<scope_radius) { y = scope_radius }
	//if (x>space_canvas.width - scope_radius) { x = space_canvas.width - scope_radius}
	//if (y>space_canvas.height - scope_radius) { y = space_canvas.height - scope_radius}

	return {x : x, y : y};
}

function zoom_image(img, scope_pos, view_pos, scale, scope_radius=100, zoom_level=4) {

	ctx.drawImage(
		img, 
		(view_pos.x - scope_radius / zoom_level) / scale, 
		(view_pos.y - scope_radius / zoom_level) / scale,
		(2 * scope_radius / zoom_level) / scale, 
		(2 * scope_radius / zoom_level) / scale, 
		scope_pos.x - scope_radius, 
		scope_pos.y - scope_radius, 
		2 * scope_radius, 
		2 * scope_radius
	)
}

function store_point(pt) {
	landmark_list.push(pt);
}

function draw_base(img, width, height, scale) {
	ctx.drawImage(img, 0, 0, width, height);
	console.log(category);
	if (category == "-- Select Category --") {
		return 0;
	}
	for (lmk in landmark_list) {
		ctx.fillStyle = "#ff0000";
		ctx.fillRect(landmark_list[lmk].x * scale - 4, landmark_list[lmk].y * scale - 4, 8, 8);
		ctx.fillStyle = "#ff0000";
		ctx.font = "40px Arial";
		var lmk_int = lmk;
		lmk_int++;
		ctx.fillText(lmk_int, landmark_list[lmk].x * scale - 10, landmark_list[lmk].y * scale - 15);
	}
}

var image_upload = function () {};

function run_canvas(src, width, height, alt, zoom_level = 4, scope_radius = 100) {
	var img = document.createElement("img");
	img.src = src;

	img.onload = function () {
		functionalInnerHeight = window.innerHeight - 20;
		max_height = functionalInnerHeight;
		max_width = window.innerWidth - 600;
		scale = Math.min(max_height / img.naturalHeight, max_width / img.naturalWidth);
		width = img.naturalWidth * scale;
		height = img.naturalHeight * scale;
		img.alt = alt;
		img.id = "img";

		space_canvas.width = width;
		space_canvas.height = height;

		draw_base(img, width, height, scale);
		ctx.fillStyle = "#ff0000";

		dontRefresh = false;
		$("#category").on("change", function() {
			category = this.value;
			console.log(category);
			var dgm_img = document.createElement("img");
			dgm_img.src = "diagrams/{0}.jpg".format(category);
			dgm_img.onload = function () {
				diagram_canvas.width = 450;
				var dgm_scale = 450 / dgm_img.naturalWidth;
				diagram_canvas.height = dgm_img.naturalHeight * dgm_scale;
				dgm_ctx.drawImage(dgm_img, 0, 0, diagram_canvas.width, diagram_canvas.height);
			}
		});
		$("#space").on("mousedown", function(e) {
			if (e.which == 1) {
				leftButtonDown = true;
				category = $("select#category option:checked").val();
				orig_click_pos = getCursorPos(space_canvas, e)
				scope_center_pos = getScopeCursorPos(space_canvas, e, scope_radius);
				scope_view_pos = getScopeCursorPos(space_canvas, e, scope_radius / zoom_level)
				if (category == "-- Select Category --") {
					ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
					ctx.fillRect(0, 0, width, height);
					ctx.font = "30px Arial";
					ctx.fillStyle = "rgba(255, 255, 255, 1)";
					ctx.fillText("--> SELECT CATEGORY -->", 100, 150);
					dontRefresh = true;
					return 0;
				}
				if (landmark_list.length >= landmark_names[category].length) {
					ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
					ctx.fillRect(0, 0, width, height);
					ctx.font = "30px Arial";
					ctx.fillStyle = "rgba(255, 255, 255, 1)";
					ctx.fillText("OUT OF LANDMARK POINTS", 100, 150);
					dontRefresh = true;
					return 0;
				}
				draw_base(img, width, height, scale)
				zoom_image(img, orig_click_pos, orig_click_pos, scale);
				ctx.fillRect(scope_view_pos.x - 4, scope_view_pos.y - 4, 8, 8); 
			} else if (e.which == 3) {
				e.preventDefault();
				landmark_list.pop()
				draw_base(img, width, height, scale);
			}
		});
		
		document.addEventListener("contextmenu", function(e){
			e.preventDefault();
		}, false);
		function tweakMouseEvent(e) {
			if (leftButtonDown) {
				e.which = 1;
			} else {
				e.which = 0;
			}
		}
		$("canvas").on("mousemove", function(e) {
			tweakMouseEvent(e);
			if (e.which == 1 && dontRefresh == false) {
				cursor_pos = getCursorPos(space_canvas, e);
				draw_base(img, width, height, scale)
				zoom_image(img, orig_click_pos, orig_click_pos, scale);
				ctx.fillRect(cursor_pos.x - 4, cursor_pos.y - 4, 8, 8); 
			}
		});
		
		$("canvas").on("mouseup", function(e) {
			tweakMouseEvent(e);
			if (e.which == 1) {
				if (dontRefresh == true) {
					dontRefresh = false;
					draw_base(img, width, height, scale);
					leftButtonDown = false;
					return 0;
				}
				dontRefresh = false;
				abs_cursor_pos = getCursorPos(space_canvas, e);
				true_cursor_pos = {
					x : (scope_view_pos.x + (abs_cursor_pos.x - scope_center_pos.x) / zoom_level) / scale, 
					y : (scope_view_pos.y + (abs_cursor_pos.y - scope_center_pos.y) / zoom_level) / scale
				}
				store_point(true_cursor_pos);
				draw_base(img, width, height, scale);
				leftButtonDown = false;
			}
		});
		image_upload = function () {
			var file = document.querySelector('input[type=file]').files[0];
			var reader = new FileReader();
			reader.onloadend = function () {
				img.src = reader.result;
			}
			if (file) {
				reader.readAsDataURL(file);
			}
		}
	}
	
}

function show(){
	run_canvas("unlabeled/".concat(img_id).concat(".jpg"), 500, 700, "label maker", zoom_level = 4);
}
window.onload = show;
