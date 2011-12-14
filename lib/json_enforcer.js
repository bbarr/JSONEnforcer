/**
 *  Validates JSON with JSON template
 *
 *  @author Brendan Barr brendanbarr.web@gmail.com
 */

var JSONEnforcer = (function() {
  
  var util, 
      Template, 
      Stub,
      JSON_TYPES = ['string', 'array', 'object', 'number'];
  
  util = {

    is_optional: function(prop) {

      if (util.is_string(prop)) {
        return /(optional)/.test(prop);
      }

      else if (util.is_array(prop)) {
        return util.is_optional(prop[0]);
      }

      else if (util.is_object(prop)) {
        for (var key in prop) {
          if (!util.is_optional(prop[key])) {
            return false;
          }
        }
        return util.is_defined(key);
      }
    },

    is_defined: function(subject) {
      return typeof subject !== 'undefined';
    },

    is_string: function(subject) {
      return typeof subject === 'string';
    },

    is_object: function(subject) {
      return subject && typeof subject === 'object' && typeof subject.length === 'undefined';
    },

    is_array: function(subject) {
      return subject && typeof subject === 'object' && typeof subject.length !== 'undefined';
    },

    is_number: function(subject) {
      return typeof subject === 'number';
    }
  };
  
  Template = function(template) {
    // nested object stack, will always contain the initial base template
    this.object_stack = [ template ];
    // keep track of what we are enforceing for logging/debugging
    this.log = [];
    this.errors = [];    
  };
  
  Template.prototype = {
    
    enforce: function(data) {
      var template = this.object_stack[this.object_stack.length - 1];
      this._enforce_properties(template, data);
      return !this.errors.length;
    },

    stub: function() {
      return new JSONEnforcer.Stub(this.object_stack[0]).generate();
    },

    _error: function(expected, actual) {
      actual_to_string = actual ? actual.toString() : actual;
      this.errors.push({
        text: 'Expected ' + expected + ', but got ' + typeof actual + '(' + actual_to_string + ').',
        location: this.log.join(', ')
      });
    },

    _enforce_properties: function(template, data) {
      var key;
      for (key in template) {
        this.log.push(key);
        this._enforce_property(template[key], data[key]);
        this.log.pop();
      };
    },

    _enforce_property: function(t_prop, d_prop) {

      if (!d_prop) {
        if (!util.is_optional(t_prop)) {
          this._error(t_prop, d_prop);
        }
        return;
      }

      if (util.is_string(t_prop)) {
        this._enforce_string(t_prop, d_prop);
      }

      else if (util.is_array(t_prop)) {
        this._enforce_array(t_prop, d_prop);
      }

      else if (util.is_object(t_prop)) {
        this._enforce_object(t_prop, d_prop);
      }
    },

    _enforce_string: function(t_prop, d_prop) {
      
      var types = t_prop.split(' '),
          pass = false, 
          method;

      if (util.is_optional(t_prop)) {
        pass = true;
      }
      else {
        types.forEach(function(t) {
          method = util['is_' + t];
          if (method && method(d_prop)) {
            pass = true;
            return;
          }
        });
      }
      
      if (!pass) {
        this._error(t_prop, d_prop);
      }
    },

    _enforce_array: function(t_prop, d_prop) {

      if ( !util.is_array(d_prop) ) {
        this._error(t_prop, d_prop);
        return;
      }

      t_prop = t_prop[0];
      for (var i = 0, len = d_prop.length; i < len; i++) {
        this._enforce_property(t_prop, d_prop[i]);
      }
    },

    _enforce_object: function(t_prop, d_prop) {
      this.object_stack.push(t_prop);
      this.enforce(d_prop);
      this.object_stack.pop();
    }
  };
  
  Stub = function(template) {
    this.object_stack = [ template ];
    this.results = {};
  };
  
  Stub.prototype = {

    generate: function() {
      
      var template = this.object_stack[this.object_stack.length - 1], 
          results = {},
          key, value;
      
      for (key in template) {
        value = this._generate_property(template[key], key);
        if (!util.is_defined(value)) continue;
        results[key] = value;
      }
      
      return results;
    },

    _generate_property: function(property, name) {
      
      if (util.is_optional(property) && this._generate_number({ min: 0, max: 1})) {
        return undefined;
      }

      if (util.is_string(property)) {
        var rules = this._generate_rules(property, name);
        return this['_generate_' + rules.type](rules);
      }

      else if (util.is_array(property)) {
        return this._generate_array(property);
      }

      else if (util.is_object(property)) {
        return this._generate_object(property);
      }
    },

    _generate_string: function(rules) {
      return 'Sample string, property: "' + rules.property + '"';
    },

    _generate_number: function(rules) {
      if (typeof rules.min === 'undefined') rules.min = 0;
      if (typeof rules.max === 'undefined') rules.max = 10;
      return Math.round(Math.random() * (rules.max - rules.min) + rules.min);
    },
    
    _generate_rules: function(prop, name) {
      
      var options = prop.split(' ').filter(function(v) { 
            return JSON_TYPES.indexOf(v) > -1; 
          }),
          random = this._generate_number({ min: 0, max: options.length - 1 });
          
      return {
        type: options[random],
        property: name 
      };
    },
    
    _generate_array: function(arr) {
      if (util.is_defined(arr[0])) {
        var property = this._generate_property(arr[0]);
        if (util.is_defined(property)) {
          return [ property ];
        }
        else {
          return undefined;
        }
      }
      return [];
    },
    
    _generate_object: function(obj) {
      this.object_stack.push(obj);
      var result = this.generate();
      this.object_stack.pop();
      return result;
    }
  };
  
  return {
    util: util,
    Template: Template,
    Stub: Stub
  };
  
})();