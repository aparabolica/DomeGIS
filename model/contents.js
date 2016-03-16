Contents = new Mongo.Collection("contents");

Meteor.methods({
  syncContent: function(content){

    content.syncedAt = Date.now();

    Contents.update({id: content.id}, { $set: { data: content } }, { upsert: true });

  }
});
