function DeftDraft(textarea) {
  this.textarea = textarea;
}


// If we are in a word (no selection or partial selection), select it.
// If we are selecting a word, select the next word.

DeftDraft.prototype.word = function(func) {
  var content = this.textarea.val();
  var sel = this.textarea.getSelection();

  var before = this.wordBoundaryBefore(sel.start, content); // -> position
  var after = this.wordBoundaryAfter(sel.end, content);

  if (this.atWordStart(before) && this.atWordEnd(after)) {
    func(sel, content);
  } else {
    this.textarea.setSelection(sel.start - before, sel.end + after);
  }  
}

DeftDraft.prototype.nextWord = function() {
  that = this; this.word(function(sel, content) {that.selectWordAfter(sel, content)});
}

DeftDraft.prototype.prevWord = function() {
  that = this; this.word(function(sel, content) {that.selectWordBefore(sel, content)});
}

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

  console.log(res);
  if (res !== null) {
    this.textarea.setSelection(sel.start - res.index - res[0].length, sel.start - res.index);
  } else {
    sel.start = content.length;
    sel.end = content.length;
    this.selectWordBefore(sel, content);
  }
}

DeftDraft.prototype.reverse = function(str) {
  return str.split("").reverse().join("");
}

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

DeftDraft.prototype.atWordStart = function(match_pos) {
  return (match_pos === 0);
}

DeftDraft.prototype.atWordEnd = function(match_pos) {
  return (match_pos === 0);
}

DeftDraft.prototype.nextSentence = function() {

}

DeftDraft.prototype.prevSentence = function() {

}

DeftDraft.prototype.nextParagraph = function() {

}

DeftDraft.prototype.prevParagraph = function() {

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
Mousetrap.bind('ctrl+w', function() {dd.nextWord()});
Mousetrap.bind('ctrl+shift+w', function() {dd.prevWord()});
Mousetrap.bind('ctrl+s', function() {dd.nextSentence()});
Mousetrap.bind('ctrl+shift+s', function() {dd.prevSentence()});
Mousetrap.bind('ctrl+a', function() {dd.nextParagraph()});
Mousetrap.bind('ctrl+shift+a', function() {dd.prevParagraph()});
Mousetrap.bind('ctrl+d', function() {dd.nextHeading()});
Mousetrap.bind('ctrl+shift+d', function() {dd.prevHeading()});
Mousetrap.bind('ctrl+e', function() {dd.expand()});
Mousetrap.bind('ctrl+shift+e', function() {dd.compress()});
