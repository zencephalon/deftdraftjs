function DeftDraft(textarea) {
  this.textarea = textarea;
}

// ================== next / prev ===================

DeftDraft.prototype.next = function(obj_t) {
  this.textFunc(obj_t).call(this, function(sel, content) { this.selectForward(sel, content, DeftDraft.regexDict['n'][obj_t]) });
}

DeftDraft.prototype.prev = function(obj_t) {
  this.textFunc(obj_t).call(this, function(sel, content) { this.selectBackward(sel, content, DeftDraft.regexDict['p'][obj_t]) });
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

DeftDraft.prototype.textFunc = function(t_obj) {
  return function(func) {
    this.textobject(this.boundaryFunc('b', t_obj), this.boundaryFunc('a', t_obj), func);
  }
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

DeftDraft.prototype.boundary = function(dir, pos, content, regex) {
  content = dir == 'a' ? content.substr(pos) : this.reverse(content.substr(0, pos));
  return this.returnResult(regex.exec(content), content);
}

// ======================== boundaries =====================

DeftDraft.regexDict = {
  'a' : {
    'w' : [0, /\W/],
    's' : [1, /[.!?](\W|$)/],
    'q' : [0, /\n\n/]
  },
  'b' : {
    'w' : [0, /\W/],
    's' : [0, /((^|\W)[.!?]|\n)/],
    'q' : [0, /\n\n/]
  },
  'n' : {
    'w' : /[\w']+(\W|$)/,
    's' : /.*?[.!?](\W|$)/,
    'q' : /.+(\n\n|$)/
  },
  'p' : {
    'w' : /(^|\W)[\w']+(\W|$)/,
    's' : /(^|\W)[.?!].*?(\W[.!?]|$|\n\n)/,
    'q' : /(\n\n|^).+(\n\n|$)/
  }
}

DeftDraft.prototype.boundaryFunc = function(dir, t_obj) {
  return function(pos, content) {
    b = DeftDraft.regexDict[dir][t_obj];
    pos -= b[0];
    return this.boundary(dir, pos, content, b[1]);
  }
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
Mousetrap.bind('ctrl+w', function() {dd.next('w'); return false});
Mousetrap.bind('ctrl+shift+w', function() {dd.prev('w'); return false});
Mousetrap.bind('ctrl+s', function() {dd.next('s'); return false});
Mousetrap.bind('ctrl+shift+s', function() {dd.prev('s'); return false});
Mousetrap.bind('ctrl+q', function() {dd.next('q'); return false});
Mousetrap.bind('ctrl+shift+q', function() {dd.prev('q'); return false});