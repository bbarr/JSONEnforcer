(function() {

  var script_ready = function(script, cb, scope) {
    scope = scope || this;
    if (script.readyState) {
      script.onreadystatechange = function() {
        if (script.readyState === 'loaded' || script.readyState === 'complete') {
          cb.call(scope);
        }
      }
    }
    else {
      script.onload = function() { 
        cb.call(scope); 
      };
    }
  }

  /** GLOBAL **/
    
  dependencies = [];
  
  NPRunner = function(finish) {
    this.finish = function() { finish.call(this); };
    this.test_script = document.getElementById('test');
    script_ready(this.test_script, this.resolve_dependencies, this);
    this.load_test();
  }
  
  NPRunner.prototype = {
    
    load_test: function() {
      var hash = window.location.hash,
          test_name = hash.substr(1);
      this.test_script.src = 'specs/' + test_name + '.js';
    },
    
    resolve_dependencies: function(path) {
      var dependency = dependencies.shift();
      if (dependency) {
        if (typeof dependency === 'function') {
          dependency();
          this.resolve_dependencies();
        }
        else {
          var script = document.createElement('script');
          script.src = dependency;
          script_ready(script, this.resolve_dependencies, this);
          document.getElementsByTagName('head')[0].appendChild(script);
        }
      }
      else {
        this.finish();
      }
    }
  }
})();