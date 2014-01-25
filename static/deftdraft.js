function DeftDraft(textarea) {
  this.textarea = textarea;
}

DeftDraft.prototype.command = function(dir, obj_t) {
  this.textFunc(obj_t).call(this, function(sel, content) { 
    this.selectFunc(dir, sel, content, DeftDraft.regexDict[dir][obj_t]) });
}

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

DeftDraft.prototype.boundaryFunc = function(dir, t_obj) {
  return function(pos, content) {
    b = DeftDraft.regexDict[dir][t_obj];
    pos -= b[0];
    content = dir == 'a' ? content.substr(pos) : content.substr(0, pos).split('').reverse().join('');
    return (res = b[1].exec(content)) !== null ? res.index : content.length;
  }
}

// =================== select helpers =================

DeftDraft.prototype.selectFunc = function(dir, sel, content, regex) {
  return dir == 'n' ? this.selectForward(sel, content, regex) : this.selectBackward(sel, content, regex);
}

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
  res = regex.exec(content.substr(0, sel.start).split('').reverse().join(''));

  if (res !== null) {
    this.textarea.setSelection(sel.start - res.index - res[0].length + res[2].length, sel.start - res.index - res[1].length);
  } else {
    sel.start = sel.end = content.length;
    this.selectBackward(sel, content, regex);
  }
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

// =================== bindings ===================

var dd = new DeftDraft($('#editor'));
['w', 's', 'q'].forEach(function (letter) {
  Mousetrap.bind('ctrl+' + letter, function() {dd.command('n', letter); return false});
  Mousetrap.bind('ctrl+shift+' + letter, function() {dd.command('p', letter); return false});
});