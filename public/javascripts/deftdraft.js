function DeftDraft(textarea) {
  this.textarea = textarea;
}

DeftDraft.prototype.textobject = function(beforeFunc, afterFunc, func) {
  var content = this.textarea.val();
  var sel = this.textarea.getSelection();

  var before = beforeFunc.call(this, sel.start, content); // -> position
  var after = afterFunc.call(this, sel.end, content);

  console.log(before + ", " + after);
  if (this.alreadySelected(before, after)) {
    func.call(this, sel, content);
  } else {
    this.textarea.setSelection(sel.start - before, sel.end + after);
  }   
}

DeftDraft.prototype.word = function(func) {
  this.textobject(this.wordBoundaryBefore, this.wordBoundaryAfter, func);
}

DeftDraft.prototype.sentence = function(func) {
  this.textobject(this.sentenceBoundaryBefore, this.sentenceBoundaryAfter, func);
}

DeftDraft.prototype.paragraph = function(func) {
  this.textobject(this.paragraphBoundaryBefore, this.paragraphBoundaryAfter, func);
}

// ================== next / prev ===================

DeftDraft.prototype.nextWord = function() {
  this.word(this.selectWordAfter);
}

DeftDraft.prototype.prevWord = function() {
  this.word(this.selectWordBefore);
}

DeftDraft.prototype.nextSentence = function() {
  this.sentence(this.selectSentenceAfter);
}

DeftDraft.prototype.prevSentence = function() {
  this.sentence(this.selectSentenceBefore);
}

DeftDraft.prototype.nextParagraph = function() {
  this.paragraph(this.selectParagraphAfter);
}

DeftDraft.prototype.prevParagraph = function() {
  this.paragraph(this.selectParagraphBefore);
}

// =================== after / before =================

DeftDraft.prototype.selectWordAfter = function(sel, content) {
  content_after = content.substr(sel.end);
  res = /\w+/.exec(content_after);

  if (res !== null) {
    this.textarea.setSelection(sel.end + res.index, sel.end + res.index + res[0].length);
  } else {
    sel.start = 0;
    sel.end = 0;
    this.selectWordAfter(sel, content);
  }
}

DeftDraft.prototype.selectWordBefore = function(sel, content) {
  content_before = this.reverse(content.substr(0, sel.start));
  res = /\w+/.exec(content_before);

  if (res !== null) {
    this.textarea.setSelection(sel.start - res.index - res[0].length, sel.start - res.index);
  } else {
    sel.start = content.length;
    sel.end = content.length;
    this.selectWordBefore(sel, content);
  }
}

DeftDraft.prototype.selectSentenceAfter = function(sel, content) {
  sel.end = sel.end + 1;
  content_after = content.substr(sel.end);
  res = /.*?[.!?](\W|$)/.exec(content_after);

  if (res !== null) {
    this.textarea.setSelection(sel.end + res.index, sel.end + res.index + res[0].length - res[1].length);
  } else {
    sel.start = 0;
    sel.end = 0;
    this.selectSentenceAfter(sel, content);
  }
}

DeftDraft.prototype.selectSentenceBefore = function(sel, content) {
  content_before = this.reverse(content.substr(0, sel.start));
  res = /(^|\W)[.?!].*?(\W[.!?]|$)/.exec(content_before);

  if (res !== null) {
    this.textarea.setSelection(sel.start - res.index - res[0].length + res[2].length, sel.start - res.index - res[1].length);
  } else {
    sel.start = content.length;
    sel.end = content.length;
    this.selectSentenceBefore(sel, content);
  }
}

DeftDraft.prototype.selectParagraphAfter = function(sel, content) {
  sel.end = sel.end + 1;
  content_after = content.substr(sel.end);
  res = /.*?(\n\n|$)/.exec(content_after);

  console.log(res);

  if (res !== null) {
    this.textarea.setSelection(sel.end + res.index, sel.end + res.index + res[0].length - res[1].length);
  }
}

// ==================== boundaries ===================

DeftDraft.prototype.wordBoundaryBefore = function(pos, content) {
  content = this.reverse(content.substr(0, pos));
  res = /\W/.exec(content);

  if (res !== null) {
    return res.index;
  } else {
    return content.length;
  }
}

DeftDraft.prototype.wordBoundaryAfter = function(pos, content) {
  content = content.substr(pos);
  res = /\W/.exec(content);

  if (res !== null) {
    return res.index;
  } else {
    return content.length;
  }
}

DeftDraft.prototype.sentenceBoundaryBefore = function(pos, content) {
  content = this.reverse(content.substr(0, pos));
  res = /(^|\W)[.!?]/.exec(content);

  if (res !== null) {
    return res.index;
  } else {
    return content.length;
  }  
}

DeftDraft.prototype.sentenceBoundaryAfter = function(pos, content) {
  pos = pos - 1;
  content = content.substr(pos);
  res = /[.!?](\W|$)/.exec(content);

  if (res !== null) {
    return res.index;
  } else {
    return content.length;
  }
}

DeftDraft.prototype.paragraphBoundaryBefore = function(pos, content) {
  content = this.reverse(content.substr(0, pos));
  res = /\n\n/.exec(content);

  if (res !== null) {
    return res.index;
  } else {
    return content.length;
  }  
}

DeftDraft.prototype.paragraphBoundaryAfter = function(pos, content) {
  content = content.substr(pos);
  res = /\n\n/.exec(content);

  if (res !== null) {
    return res.index;
  } else {
    return content.length;
  }
}

// ===================== helpers ==================

DeftDraft.prototype.reverse = function(str) {
  return str.split("").reverse().join("");
}

DeftDraft.prototype.alreadySelected = function(start, end) {
  return (start === 0 && end === 0);
}

DeftDraft.prototype.nextHeading = function() {

}

DeftDraft.prototype.prevHeading = function() {

}

DeftDraft.prototype.expand = function() {

}

DeftDraft.prototype.compress = function() {

}

var dd = new DeftDraft($('#editor'));
Mousetrap.bind('ctrl+w', function() {dd.nextWord(); return false});
Mousetrap.bind('ctrl+shift+w', function() {dd.prevWord(); return false});
Mousetrap.bind('ctrl+s', function() {dd.nextSentence(); return false});
Mousetrap.bind('ctrl+shift+s', function() {dd.prevSentence(); return false});
Mousetrap.bind('ctrl+a', function() {dd.nextParagraph(); return false});
Mousetrap.bind('ctrl+shift+a', function() {dd.prevParagraph(); return false});
Mousetrap.bind('ctrl+d', function() {dd.nextHeading(); return false});
Mousetrap.bind('ctrl+shift+d', function() {dd.prevHeading(); return false});
Mousetrap.bind('ctrl+e', function() {dd.expand(); return false});
Mousetrap.bind('ctrl+shift+e', function() {dd.compress(); return false});

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

