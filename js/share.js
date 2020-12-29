(function(exports){
  /*
   * Emojies and confedence 
   */
    exports.getEmoteFromConfidenceLevel = function(confidenceLevel)
    {
        switch(confidenceLevel)
        {
          case 100 : return "fa-grin-stars shaking";
          case 2 : return "fa-laugh";
          case 1 : return "fa-smile-beam";
          case 0 : return "fa-smile";
          case -1 : return "fa-meh";
          case -2 : return "fa-grimace";
          case -3 : return "fa-flushed";
          //case -4 : return "fa-flushed headShake";
          case -100: return "fa-sad-cry headShake";
        }
    };

    exports.cleanString = function(input) 
    {
      return input.replace(/[^0-9a-z]/gi, '').toLowerCase();
    };

    exports.maxConfidence = 2;
    exports.minConfidence = -3;

  }(typeof exports === 'undefined' ? this.share = {} : exports));