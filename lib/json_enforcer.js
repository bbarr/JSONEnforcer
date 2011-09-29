/**
 *  Validates JSON with JSON template
 *
 *  Example: 
 *
 *  var data_interface = { a: 'string', b: { c: 'number' }}
 *  var data = { a: 'some string', b: { c: 10 }}
 *
 *  new JSONEnforcer(data_interface).ensure(data);
 *
 *  => success (true) or failure (false)
 */

var JSONEnforcer = function(template) {
  this.templates = [ template ];
  this.errors = [];
  this.keys = [];
  this.is_required = false;
};

JSONEnforcer.prototype = {
  
  ensure: function(data, cb) {
    
    var template = this.templates[this.templates.length - 1],
        key, t_prop, d_prop, passed;
    
    this.cb = cb;
    
    this._ensure_properties(template, data);

    // keep track of template depth for recursive calls
    this.templates.pop();
    if (this.templates[0]) return;

    passed = typeof this.errors[0] === 'undefined';
    if (cb) cb.call(this, (passed ? null : this.errors));
    return passed;
  },
  
  _ensure_properties: function(template, data) {
    for (key in template) {
      this.keys.push(key);
      this._ensure_property(template[key], data[key]);
      this.keys.pop();
    };
  },
  
  _ensure_property: function(t_prop, d_prop) {
    
    if (!d_prop && this._detect_required(t_prop)) {
      this._error(t_prop, d_prop);
      return;
    }
    
    if (this._is_string(t_prop)) {
      this._handle_string(t_prop, d_prop);
    }
    
    else if (this._is_array(t_prop)) {
      this._handle_array(t_prop, d_prop);
    }
    
    else if (this._is_object(t_prop)) {
      this._handle_object(t_prop, d_prop);
    }
  },
  
  _detect_required: function(prop) {
    
    if (this._is_string(prop)) {
      return prop.indexOf('required') > -1;
    }
    
    else if (this._is_array(prop)) {
      return this._detect_required(prop[0]);
    }
    
    else if (this._is_object(prop)) {
      for (var key in prop) {
        if (this._detect_required(prop[key])) {
          return true;
        }
      }
      return false;
    }
  },
  
  _handle_string: function(t_prop, d_prop) {
    if ( !this['_is_' + t_prop](d_prop) ) {
      this._error(t_prop, d_prop);
    }
  },
  
  _handle_array: function(t_prop, d_prop) {
    
    if ( !this._is_array(d_prop) ) {
      this._error(t_prop, d_prop);
      return;
    }
    
    t_prop = t_prop[0];
    for (var i = 0, len = d_prop.length; i < len; i++) {
      this._ensure_property(t_prop, d_prop[i]);
    }
  },
  
  _handle_object: function(t_prop, d_prop) {
    this.templates.push(t_prop);
    this.ensure(d_prop);
  },
  
  _error: function(expected, actual) {
    this.errors.push({
      text: 'Expected ' + expected + ', but got ' + typeof actual + '(' + actual.toString() + ').',
      location: this.keys.join(', ')
    });
  },
  
  _is_string: function(subject) {
    return typeof subject === 'string';
  },
  
  _is_object: function(subject) {
    return subject && typeof subject === 'object' && typeof subject.length === 'undefined';
  },
  
  _is_array: function(subject) {
    return subject && typeof subject === 'object' && typeof subject.length !== 'undefined';
  },
  
  _is_number: function(subject) {
    return typeof subject === 'number';
  }
};