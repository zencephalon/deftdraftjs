function DeftDraft(textarea) {
  this.textarea = textarea;
}

DeftDraft.prototype.nextWord = function() {
    console.log(this.textarea.value);
}

var dd = new DeftDraft(document.getElementById('editor'));
Mousetrap.bind('ctrl+w', function() {dd.nextWord()});
