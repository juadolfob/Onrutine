
import "./time"

var sound = new Audio("https://www.freespecialeffects.co.uk/soundfx/animals/duck1.wav");
sound.loop = true;

function alarmSet(_hr,_min,_sec) {

  var hr = _hr;
  var min = _min;
  var sec = _sec;

  var alarmTime = addZero(selectedHour) + ":" + addZero(selectedMin) + ":" + addZero(selectedSec);
  console.log('alarmTime:' + alarmTime);

//when alarmtime is equal to currenttime then play a sound
  /*function to calcutate the current time
  then compare it to the alarmtime and play a sound when they are equal
  */

  setInterval(function(){

    var date = new Date();

    var hours = (12 - (date.getHours()));
    // var hours = date.getHours();

    var minutes = date.getMinutes();

    var seconds = date.getSeconds();

    var ampm = (date.getHours()) < 12 ? 'AM' : 'PM';


    //convert military time to standard time

    if (hours < 0) {
      hours = hours * -1;
    } else if (hours == 00) {
      hours = 12;
    } else {
      hours = hours;
    }

    var currentTime = new Date();

    if (alarmTime == currentTime) {
      sound.play();
    }

  },1000);


  // console.log('currentTime:' + currentTime);

}
