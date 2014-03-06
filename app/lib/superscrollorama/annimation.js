var controller = $.superscrollorama();
var pinDur = 4000;
var pinAnimations = new TimelineLite();
pinAnimations.append([
	TweenMax.to($('#0'), 1, {css:{marginLeft:0}}),
	TweenMax.to($('#0'), 1, {css:{marginLeft:'100%'}})
], .5);
controller.pin($('#0'), pinDur, {
	anim:pinAnimations, 
	onPin: function() {
		$('#0').css('height','100%');
	}, 
	onUnpin: function() {
		$('#0').css('height','600px');
}});
