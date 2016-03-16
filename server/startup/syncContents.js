Meteor.startup(function(){

  function updateContent(){
    var content = Contents.findOne({}, {sort: {syncedAt: 1}});

    if (content) {
      console.log(content.id);
      console.log(content.syncedAt);

      var res = arcgis.getItemSync(content.id);

      console.log(res.data.modified);
      console.log(content.data.modified);

      if (res.data && (res.data.modified != content.data.modified)) {
        console.log('modified');
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
