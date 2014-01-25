function DeftDraft(textarea) {
  this.textarea = textarea;
}


// If we are in a word (no selection or partial selection), select it.
// If we are selecting a word, select the next word.
DeftDraft.prototype.nextWord = function() {
  var content = this.textarea.val();
  var sel = this.textarea.getSelection();
  console.log(sel.start + ", " + sel.end);

  // wordBoundaryBefore(pos, content) -> position
  // wordBoundaryAfter(pos, content) -> position
}

DeftDraft.prototype.wordBoundaryBefore = function(pos, content) {
  
}

DeftDraft.prototype.prevWord = function() {

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
Mousetrap.bind('ctrl+shift+w', function() {dd.nextWord()});
Mousetrap.bind('ctrl+s', function() {dd.nextSentence()});
Mousetrap.bind('ctrl+shift+s', function() {dd.prevSentence()});
Mousetrap.bind('ctrl+a', function() {dd.nextParagraph()});
Mousetrap.bind('ctrl+shift+a', function() {dd.prevParagraph()});
Mousetrap.bind('ctrl+d', function() {dd.nextHeading()});
Mousetrap.bind('ctrl+shift+d', function() {dd.prevHeading()});
Mousetrap.bind('ctrl+e', function() {dd.expand()});
Mousetrap.bind('ctrl+shift+e', function() {dd.compress()});
