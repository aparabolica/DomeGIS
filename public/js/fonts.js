WebFontConfig = {
  google: {
    families: [
      'Open+Sans:400,300,300italic,400italic,600,600italic,700,800,700italic,800italic:latin',
      'Raleway:400,700,600italic,600,500italic,500,400italic,300italic,300,200italic,200,100italic,100,800'
  ] }
};
(function() {
  var wf = document.createElement('script');
  wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();
