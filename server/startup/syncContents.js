Meteor.startup(function(){

  function updateContent(){
    var content = Contents.findOne({}, {sort: {syncedAt: 1}});

    if (content) {

      var res = arcgis.getItemSync(content._id);

      if (res.data && (res.data.modified != content.data.modified)) {
        Contents.update({
          _id: content._id
        }, _.extend(res.data, {
          syncedAt: Date.now()
        }));
      }
    }

    Meteor.setTimeout(updateContent, 2000);
  }

  updateContent();

});
