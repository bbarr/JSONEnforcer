/**
 *  Validates JSON with JSON template
 *
 *  @author Brendan Barr brendanbarr.web@gmail.com
 */

var JSONEnforcer = (function() {
  
  'use strict'
  
  var util,
      generator,
      api,
    
      // constructors
      Rules,
      Template,
      Stub,
      Lexer,
      
      // constants
      JSON_TYPES = ['string', 'array', 'object', 'number'],
      
      RULES_TYPE_RE = new RegExp("(" + JSON_TYPES.join('|') + ")"),
      RULES_VALIDATION_RE = /\((.+)\)/,
      RULES_RANGE_RE = /\((\d*),*(\d*)\)/,
      REGEX_SYNTAX = '[\\^$.|?*+(){}'.split('').join('\\'),
      DEFAULT_STRING_VALIDATION = '(.+)',
      DEFAULT_NUMBER_RANGE = '(0,100)',
      
      ALPHA = 'abcdefghijklmnopqrstuvwxyz',
      ALPHA_COMBINED = ALPHA + ALPHA.toUpperCase(), 
      NUMERIC = '0123456789',
      ALPHA_NUMERIC = ALPHA_COMBINED + NUMERIC;
  
  util = {

    is_optional: function(prop) {

      if (prop instanceof Rules) {
        return prop.optional;
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
    
  generator = {
    
    number: function(min, max) {
      min = util.is_defined(min) ? min : 0;
      max = util.is_defined(max) ? max : 100;
      return Math.round(Math.random() * (max - min) + min);
    },
    
    string: function(rules) {
      return new Lexer(rules).generate();
    }
  };
  
  Lexer = function(rules) {
    this.rules = rules instanceof RegExp ? rules.toString().replace(/^\/|\/$/g, '') : rules;
    this.tokenized = [];
    this.errors = [];
    this.current_match = '';
  };
  
  Lexer.prototype = {
    
    _tokens: {
      set: /\[[\w\d\s\-\\]+\]/,
      quantifier: /\{(\d*),*(\d*)\}|\+|\*/,
      special: /^(\\\w|\.)$/,      
      literal: new RegExp('^[^' + REGEX_SYNTAX + ']$')
    },
    
    generate: function() {
      this._tokenize();
      var string = this._generate();
      return string;
    },
    
    _tokenize: function() {
      var self = this, key;
      this.rules
        .split('')
        .forEach(function(c) {
          self.current_match += c;
          for (key in self._tokens) {
            if (self._tokens[key].test(self.current_match)) {
              self.tokenized.push({ name: key, value: self.current_match });
              self.current_match = '';
              break;
            }
          }
        });
    },
    
    _generate: function() {
      
      var string = '',
          last_token, last_value,
          self = this;
      
      this.tokenized.forEach(function(token) {
        last_value = self['_generate_' + token.name](token, last_token);
        string += last_value = (typeof last_value === 'function') ? last_value(string) : last_value;
        token.generated = last_value;
        last_token = token;
      });
      
      return string;
    },
    
    _generate_literal: function(token) {
      return token.value;
    },
    
    _generate_special: function(token) {
      
      var string = '';
      
      switch (token.value) {
        case '\\w':
          string += ALPHA_NUMERIC.charAt(generator.number(0, ALPHA_NUMERIC.length - 1));
          break;
        case '\\d':
          string += NUMERIC.charAt(generator.number(0, NUMERIC.length - 1 ));
          break;
        case '.':
          string += ALPHA_NUMERIC.charAt(generator.number(0, ALPHA_NUMERIC.length - 1));
          break;
      }
      
      return string;
    },
    
    _generate_set: function(token, last_token) {
      
      var set = '',
          value = token.value.replace(/(^\[)|(\]$)/g, ''),
          hyphened = value.match(/\w\-\w/),
          specials = value.match(/\\\w/g);
      
      while (hyphened && hyphened[0]) {
        
        var parts = hyphened[0].split('-'),
            min = parts[0],
            max = parts[1],
            master_set = isNaN(parseInt(min, 10)) ? ALPHA : NUMERIC;
        
        set += master_set.substring(master_set.indexOf(min), master_set.indexOf(max) + 1);
            
        value = value.replace(hyphened, '');
        hyphened = value.match(/\w\-\w/);
      };
      
      if (specials) {
        for (var i = 0, len = specials.length; i < len; i++) {

          switch (specials[i]) {
            case '\\w':
              set += ALPHA_NUMERIC;
              break;
            case '\\d':
              set += NUMERIC;
              break;
          }

          value = value.replace(specials[i], '');
        }
      }

      set += value;
      
      return set.charAt(generator.number(0, set.length - 1));
    },
    
    _generate_quantifier: function(token, last_token) {
      
      var cb,
          self = this,
          generate_cb = function(repeats) {
            return function(s) {
              s = s.replace(last_token.generated, '');
              while (repeats--) {
                s += self['_generate_' + last_token.name](last_token);
              }
              return s;
            }
          };
      
      switch (token.value) {
        case '*':
          cb = generate_cb(generator.number(0, 100));
          break;
        case '+':
          cb = generate_cb(generator.number(1, 100));
          break;
        default:
        
          var matches = token.value.match(this._tokens.quantifier),
              min = parseInt(matches[1], 10) || 0,
              max = parseInt(matches[2], 10) || (min + 100),
              repeats = generator.number(min, max);
              
          cb = generate_cb(repeats);
      }
      
      return cb;
    }
  };
      
  Rules = function(raw) {
    
    this.raw = raw;
    
    this.type = raw.match(RULES_TYPE_RE);
    this.type && (this.type = this.type[1]);
    
    switch (this.type) {
      case "string":
        this.validation = raw.match(RULES_VALIDATION_RE) || DEFAULT_STRING_VALIDATION.match(RULES_VALIDATION_RE);
        this.validation = new RegExp(this.validation.pop());
        break;
      case "number":
        this.range = raw.match(RULES_RANGE_RE) || DEFAULT_NUMBER_RANGE.match(RULES_RANGE_RE);
        this.range = this.range.slice(1).map(function(r) { return parseInt(r, 10) });
        break;
    }
    
    this.optional = raw.indexOf('optional') > -1;
  };
  
  Rules.populate = function(raw_template) {

    var key,
        prop,
        populated_template = {};
    
    for (key in raw_template) {
      populated_template[key] = Rules._populate_property(raw_template[key]);
    }
    
    return populated_template;
  }
  
  Rules._populate_property = function(prop) {
    if (util.is_string(prop)) {
      return new Rules(prop);
    }
    else if (util.is_array(prop)) {
      return [ Rules._populate_property(prop[0]) ];
    }
    else if (util.is_object(prop)) {
      return Rules.populate(prop);
    }
  };
  
  Template = function(template) {
    
    template = Rules.populate(template);
    
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
      return new JSONEnforcer.Stub(this).generate();
    },

    _error: function(expected, actual, message) {
      var actual_to_string = actual ? actual.toString() : actual;
      this.errors.push({
        text: message || 'Expected ' + expected + ', but got ' + typeof actual + '(' + actual_to_string + ').',
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

      if (t_prop instanceof Rules) {
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
      
      var pass = t_prop.optional,
          d_prop_string = d_prop.toString();
      
      if (!pass) {
        if (!util['is_' + t_prop.type](d_prop)) {
          this._error(t_prop, d_prop);
        }
      }
      
      if (t_prop.validation && !t_prop.validation.test(d_prop_string)) {
        this._error(t_prop, d_prop, 'Validation failed: ' + t_prop.validation + ' - ' + d_prop_string);
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
    template = (template instanceof Template) ? template.object_stack[0] : Rules.populate(template);
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
      
      if (util.is_optional(property) && generator.number(0, 1)) {
        return undefined;
      }

      if (property instanceof Rules) {
        return this['_generate_' + property.type](property);
      }

      else if (util.is_array(property)) {
        return this._generate_array(property);
      }

      else if (util.is_object(property)) {
        return this._generate_object(property);
      }
    },

    _generate_string: function(rules) {
      return generator.string(rules.validation);
    },

    _generate_number: function(rules) {
      return generator.number(rules.range[0], rules.range[1]);
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
  
  api = {
    Template: Template,
    Stub: Stub
  };
  
  // reveal privates if jasmine is here to test
  if (util.is_defined(window.jasmine)) {
    api.__exec__ = function() {
      var re = /(\(\))$/,
          args = [].slice.call(arguments),
          name = args.shift(),
          is_method = re.test(name),
          name = name.replace(re, ''),
          target = eval(name);
      return is_method ? target.apply(this, args) : target;
    }
  };
  
  return api;
})();