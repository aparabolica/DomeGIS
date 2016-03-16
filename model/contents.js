Contents = new Mongo.Collection("contents");

Meteor.methods({
  syncContent: function(content){

    Contents.update({_id: content.id}, {
      $set: {
        data: content,
        syncedAt: Date.now()
      }
    }, { upsert: true });

  }
});
