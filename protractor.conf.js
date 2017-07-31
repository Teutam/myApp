exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  //seleniumServerJar: './node_modules/selenium-standalone-jar/bin/selenium-server-standalone-3.0.1.jar',
  seleniumPort: 4444,
  /*chromeOnly: true,
  directConnect: true,*/
  capabilities: {
    'browserName': 'chrome'
  },
 
  baseUrl: 'http://localhost:5000/',
 
  framework: 'jasmine2',
 
  // Spec patterns are relative to the current working directly when
  // protractor is called.
 specs: ['todo-spec.js'],
 
  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    isVerbose : true,
    includeStackTrace : false
  },
  
  onPrepare: function() {
    var jasmineReporters = require('jasmine-reporters');
    jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
        consolidateAll: true,
        savePath: 'testresults',
        filePrefix: 'xmloutput'
    }));
}
  
};