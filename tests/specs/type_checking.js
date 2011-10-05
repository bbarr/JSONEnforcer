describe('Type Checking', function() {
  
  var enforcer = new JSONEnforcer({}),
      a_string = '',
      a_number = 0,
      an_array = [],
      an_object = {};
      
  describe('#is_string', function() {
    
    it ('should return true for a string', function() {
      expect(enforcer._is_string(a_string)).toBe(true);
    });
  });
  
  describe('#is_number', function() {
    
    it ('should return true for a number', function() {
      expect(enforcer._is_number(a_number)).toBe(true);
    });
  });
  
  describe('#is_array', function() {
    
    it ('should return true for an array', function() {
      expect(enforcer._is_array(an_array)).toBe(true);
    });
    
    it ('should fail for an object', function() {
      expect(enforcer._is_array(an_object)).toBe(false);
    });
  });
  
  describe('#is_object', function() {
    
    it ('should return true for an object', function() {
      expect(enforcer._is_object(an_object)).toBe(true);
    });
    
    it ('should fail for an array', function() {
      expect(enforcer._is_object(an_array)).toBe(false);
    });
  });
  
});