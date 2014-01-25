function DeftDraft(textarea) {
  this.textarea = textarea;
}

// ================== next / prev ===================

DeftDraft.prototype.nextWord = function() {
  this.word(function(sel, content) { this.selectForward(sel, content, 
    /[\w']+(\W|$)/ )});
}

DeftDraft.prototype.nextSentence = function() {
  this.sentence(function(sel, content) { this.selectForward(sel, content, 
    /.*?[.!?](\W|$)/ )});
}

DeftDraft.prototype.nextParagraph = function() {
  this.paragraph(function(sel, content) { this.selectForward(sel, content, 
    /.+(\n\n|$)/ )});
}

DeftDraft.prototype.prevWord = function() {
  this.word(function(sel, content) { this.selectBackward(sel, content,
    /(^|\W)[\w']+(\W|$)/ )});
}

DeftDraft.prototype.prevSentence = function() {
  this.sentence(function(sel, content) { this.selectBackward(sel, content,
    /(^|\W)[.?!].*?(\W[.!?]|$|\n\n)/ )});
}

DeftDraft.prototype.prevParagraph = function() {
  this.paragraph(function(sel, content) { this.selectBackward(sel, content,
    /(\n\n|^).+(\n\n|$)/ )});
}

// ================= text element helpers ================

DeftDraft.prototype.textobject = function(beforeFunc, afterFunc, func) {
  var content = this.textarea.val();
  var sel = this.textarea.getSelection();

  var before = beforeFunc.call(this, sel.start, content);
  var after = afterFunc.call(this, sel.end, content);

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

// =================== select helpers =================

DeftDraft.prototype.selectForward = function(sel, content, regex) {
  res = regex.exec(content.substr(sel.end));

  if (res !== null) {
    this.textarea.setSelection(sel.end + res.index, sel.end + res.index + res[0].length - res[1].length);
  } else {
    sel.start = sel.end = 0;
    this.selectForward(sel, content, regex);
  }  
}

DeftDraft.prototype.selectBackward = function(sel, content, regex) {
  res = regex.exec(this.reverse(content.substr(0, sel.start)));

  if (res !== null) {
    this.textarea.setSelection(sel.start - res.index - res[0].length + res[2].length, sel.start - res.index - res[1].length);
  } else {
    sel.start = sel.end = content.length;
    this.selectBackward(sel, content, regex);
  }
}

// ==================== boundary helpers ===================

DeftDraft.prototype.returnResult = function(res, content) {
  return res !== null ? res.index : content.length;
}

DeftDraft.prototype.boundaryAfter = function(pos, content, regex) {
  content = content.substr(pos);
  return this.returnResult(regex.exec(content), content);
}

DeftDraft.prototype.boundaryBefore = function(pos, content, regex) {
  content = this.reverse(content.substr(0, pos));
  return this.returnResult(regex.exec(content), content);
}

// ======================== boundaries =====================

DeftDraft.prototype.wordBoundaryAfter = function(pos, content) {
  return this.boundaryAfter(pos, content, 
    /\W/ );
}

DeftDraft.prototype.sentenceBoundaryAfter = function(pos, content) {
  pos--;
  return this.boundaryAfter(pos, content,
    /[.!?](\W|$)/ );
}

DeftDraft.prototype.paragraphBoundaryAfter = function(pos, content) {
  return this.boundaryAfter(pos, content,
    /\n\n/ );
}

DeftDraft.prototype.wordBoundaryBefore = function(pos, content) {
  return this.boundaryBefore(pos, content,
    /\W/ );
}

DeftDraft.prototype.sentenceBoundaryBefore = function(pos, content) {
  return this.boundaryBefore(pos, content,
    /((^|\W)[.!?]|\n)/ );
}

DeftDraft.prototype.paragraphBoundaryBefore = function(pos, content) {
  return this.boundaryBefore(pos, content,
    /\n\n/ );
}

// ===================== helpers ==================

DeftDraft.prototype.reverse = function(str) {
  return str.split("").reverse().join("");
}

DeftDraft.prototype.alreadySelected = function(start, end) {
  return (start === 0 && end === 0);
}

// =================== bindings ===================

var dd = new DeftDraft($('#editor'));
Mousetrap.bind('ctrl+w', function() {dd.nextWord(); return false});
Mousetrap.bind('ctrl+shift+w', function() {dd.prevWord(); return false});
Mousetrap.bind('ctrl+s', function() {dd.nextSentence(); return false});
Mousetrap.bind('ctrl+shift+s', function() {dd.prevSentence(); return false});
Mousetrap.bind('ctrl+q', function() {dd.nextParagraph(); return false});
Mousetrap.bind('ctrl+shift+q', function() {dd.prevParagraph(); return false});