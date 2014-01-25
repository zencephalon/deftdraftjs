function DeftDraft(textarea) {
  this.textarea = textarea;
}
// Main function, delegates to helpers.
DeftDraft.prototype.command = function(dir, obj_t) {
  this.textFunc(obj_t).call(this, function(sel, content) { 
    this.selectFunc(dir, sel, content, DeftDraft.regexDict[dir][obj_t]) });
}
// If the selection lies within the text object's boundaries, expand to select it
// If a text object is already selected, select the next or previous one.
DeftDraft.prototype.textFunc = function(t_obj) {
  return function(func) {
    var content = this.textarea.val();
    var sel = this.textarea.getSelection();

    var before = this.boundaryFunc.call(this, 'b', t_obj)(sel.start, content);
    var after = this.boundaryFunc.call(this, 'a', t_obj)(sel.end, content);

    if (before == 0 && after == 0) {
      func.call(this, sel, content);
    } else {
      this.textarea.setSelection(sel.start - before, sel.end + after);
    }
  }
}
// Determine where the boundary for the text object lies in either direction.
DeftDraft.prototype.boundaryFunc = function(dir, t_obj) {
  return function(pos, content) {
    b = DeftDraft.regexDict[dir][t_obj];
    pos -= b[0];
    content = dir == 'a' ? content.substr(pos) : content.substr(0, pos).split('').reverse().join('');
    return (res = b[1].exec(content)) !== null ? res.index : content.length;
  }
}
// Select the next instance of the regex, wrapping around if needed.
DeftDraft.prototype.selectForward = function(sel, content, regex) {
  res = regex.exec(content.substr(sel.end));

  if (res !== null) {
    this.textarea.setSelection(sel.end + res.index, sel.end + res.index + res[0].length - res[1].length);
  } else {
    sel.start = sel.end = 0;
    this.selectForward(sel, content, regex);
  }  
}
// As above but backward.
DeftDraft.prototype.selectBackward = function(sel, content, regex) {
  res = regex.exec(content.substr(0, sel.start).split('').reverse().join(''));

  if (res !== null) {
    this.textarea.setSelection(sel.start - res.index - res[0].length + res[2].length, sel.start - res.index - res[1].length);
  } else {
    sel.start = sel.end = content.length;
    this.selectBackward(sel, content, regex);
  }
}
// Convenience wrapper.
DeftDraft.prototype.selectFunc = function(dir, sel, content, regex) {
  return dir == 'n' ? this.selectForward(sel, content, regex) : this.selectBackward(sel, content, regex);
}
// Stores the regexes used.
DeftDraft.regexDict = {
  'a' : { // after, for boundaries
    'w' : [0, /\W/], // word, no offset, non-word char
    's' : [1, /[.!?](\W|$)/], // sentence, offset for punctuation, punctuation followed by non-word or end
    'q' : [0, /\n\n/] // qaragraph, no offset, two new lines
  },
  'b' : { // before, for boundaries -- note these regexes operate on the input reversed
    'w' : [0, /\W/], // word, no offset, non-word char
    's' : [0, /((^|\W)[.!?]|\n)/], // sentence, no offset, (punctuation followed by non-word or start) or new line
    'q' : [0, /\n\n/] // qaragraph, no offset, two new lines
  },
  'n' : { // next, for selections
    'w' : /[\w']+(\W|$)/, // word, a number of word chars ended by end or non-word char
    's' : /.*?[.!?](\W|$)/, // sentence, a number of chars ended by punctuation and non-char char or end
    'q' : /.+(\n\n|$)/ // qaragraph, a number of chars ended by two new lines or the end
  },
  'p' : {
    'w' : /(^|\W)[\w']+(\W|$)/, // word, a number of word chars ended by end or non-word char
    's' : /(^|\W)[.?!].*?(\W[.!?]|$|\n\n)/, // sentence, can start with new paragraph or start of text, or end of earlier sentence, a number of chars, ending in punctuation followed by non-word char or end
    'q' : /(\n\n|^).+(\n\n|$)/ // qaragraph, start with new paragraph or start of text end with paragraph or end
  }
}
// Create new DeftDraft object.
var dd = new DeftDraft($('#editor'));
// Set the key bindings.
['w', 's', 'q'].forEach(function (letter) {
  Mousetrap.bind('ctrl+' + letter, function() {dd.command('n', letter); return false});
  Mousetrap.bind('ctrl+shift+' + letter, function() {dd.command('p', letter); return false});
});

document.getElementById("editor").onkeyup = checkUpdate;

window.onbeforeunload = function (event) {
 /* var message = 'Sure you want to leave?';
  if (typeof event == 'undefined') {
    event = window.event;
  }
  if (event) {
    event.returnValue = message;
  }
  return message;
  checkUpdate("close");*/
}

var updateTime = 0;
function checkUpdate(e){
  trackChanges();
  if (e != "close"){            //wait for 5 seconds before last update
    var currentTime = Math.floor( new Date().getTime()/1000 );
    if (updateTime - currentTime < -5){
      updateTime = currentTime;
      //update server
      updateServer();
    }
  } else{                     //disregard time on close and update server
      updateTime = currentTime;
      updateServer();
  }
}

function updateServer(){
  content = dd.textarea.val();
  //console.log(content);
  console.log("updating...");

  $.post( document.URL, {
    "content": content
  });
}

$("#postContent").click(function(req, res){
  content = dd.textarea.val();
  var d_id = document.URL.split('/')[4];
  $.post( '/commit', {
    "commit_statement": $("#commit_message").val()
    ,"content": content
    ,"d_id": d_id
  }); 
});

var cursor_pos;
var text = dd.textarea.val();
var lc_time = "";
var diffs = [];
var diff = [];
var operation;
var prev_operation;

var editor_div = document.getElementById("editor");

$(document).ready(function(){
  $("#editor").focus();
})

$("#editor").focus(function(){
  cursor_pos = getCaret(editor_div);
});

$("#editor").click(function(){
  cursor_pos = getCaret(editor_div);
});


function trackChanges(){
  
  now_text = dd.textarea.val();
  now_cursor_pos = getCaret(editor_div);

  d_tx = now_text.length - text.length;
  d_cr = now_cursor_pos - cursor_pos;
  //console.log(d_tx, d_cr);
  if (now_text == text){
    change_type = "no change";
    console.log(change_type);
  }
  else{
    var currentTime = Math.floor( new Date().getTime()/1000 );
    d_t = currentTime - lc_time;
    console.log(d_tx, d_cr);
    opChange();
    if ( d_tx > 0 && d_cr > 0 && d_tx == d_cr ) {              
        //insert operation at continous location
      change_type = "ins";
      diff = ["ins", cursor_pos, now_text.substr(cursor_pos, d_cr), d_t];
      operation = 1;
    } else if ( ( d_tx < 0 ^ d_cr < 0 ) && d_tx != d_cr ) {
      //insert at different location
      operation = 2;
    } else if ( (d_tx < 0 && d_cr < 0 ) && d_tx != d_cr ) {
      //delete at continous location
      operation = 3;
      change_type = "del";
      diff = ["del", cursor_pos, -d_tx, d_t];
    } else{
      //delete at different location
      operation = 4;
      change_type = "del";
      diff = ["del", cursor_pos, -d_tx, d_t];
    }
    console.log(diff);
    lc_time = currentTime;
  }

  function opChange(){
    //  console.log(cursor_pos);
    if ( ( operation != prev_operation && (operation==1 || operation==3)) || operation==2 || operation==4 ){
      diffs.push(diff);
      diff = [];
      cursor_pos = getCaret(editor_div);
    text = now_text;
    }
    prev_operation = operation;
  }

}

function getCaret(el) {
  if (el.selectionStart)
    return el.selectionStart; 
  else if (document.selection) { 
    el.focus(); 
    var r = document.selection.createRange(); 
    if (r == null) { 
      return 0; 
    } 
    var re = el.createTextRange(), 
    rc = re.duplicate(); 
    re.moveToBookmark(r.getBookmark()); 
    rc.setEndPoint('EndToStart', re); 

    var add_newlines = 0;
    for (var i=0; i<rc.text.length; i++) {
      if (rc.text.substr(i, 2) == '\r\n') {
        add_newlines += 2;
        i++;
      }
    }
    //return rc.text.length + add_newlines;
    //Substract the no. of lines
    return rc.text.length - add_newlines; 
  }  
  return 0; 
}

