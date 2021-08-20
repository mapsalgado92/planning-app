import { ObjectID } from "mongodb";
import { updateInDatabase, connectToDatabase, getFromDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {

  const { db } = await connectToDatabase()

  const { collection, query } = req.query

  let parsedQuery = {}

  if (query) {
    parsedQuery = {}
    query.forEach(param => {
      let split = param.split("=")
      parsedQuery[split[0]] = split[1]
    })
  }

  console.log(parsedQuery)

  if (req.method === 'GET') {
    let output = await getFromDatabase(db, collection, parsedQuery)
    console.log(`Item Fetched from ${collection}`)
    if (output.length > 0) {
      res.status(200).json(output)
    } else {
      res.status(404).json(output)
    }
  }
}