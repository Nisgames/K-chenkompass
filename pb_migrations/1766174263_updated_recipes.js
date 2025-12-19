/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_842702175")

  // update collection data
  unmarshal({
    "listRule": "isPrivate = false || (id != \"\" && author = @request.auth.id)",
    "viewRule": "isPrivate = false || (id != \"\" && author = @request.auth.id)"
  }, collection)

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "bool3032584721",
    "name": "isPrivate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_842702175")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // remove field
  collection.fields.removeById("bool3032584721")

  return app.save(collection)
})
