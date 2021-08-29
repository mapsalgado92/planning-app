import Head from 'next/head'
import { useState } from 'react'
import { Row, Col, ListGroup, Container } from 'react-bootstrap'
import CapManagement from '../components/management/CapManagement'
import LobManagement from '../components/management/LobManagement'
import ProjectManagement from '../components/management/ProjectManagement'
import { connectToDatabase } from '../lib/mongodb'

export default function Management(props) {

  const [data, setData] = useState(props)
  const [screen, setScreen] = useState("project")

  const handleRefresh = async (collection) => {

    const newData = await fetch(`api/${collection}`).then(res => res.json())

    console.log("NEW DATA: ", newData)

    setData({ ...data, [collection]: newData })
  }

  return (
    <>
      <Head>
        <title>Planning App | Management</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Container className="mt-4">

          <Row>
            <Col sm={3}>
              <h1>Management</h1>
              <br></br>
              <ListGroup>
                <ListGroup.Item action onClick={() => setScreen("projects")}>Projects</ListGroup.Item>
                <ListGroup.Item action onClick={() => setScreen("lobs")}>LOBs</ListGroup.Item>

                <ListGroup.Item action onClick={() => setScreen("capPlans")}>Capacity Plans</ListGroup.Item>
              </ListGroup>

            </Col>
            <Col sm={9}>

              {screen === "projects" && <ProjectManagement data={data} refresh={handleRefresh}></ProjectManagement>}
              {screen === "lobs" && <LobManagement data={data} refresh={handleRefresh}></LobManagement>}
              {screen === "capPlans" && <CapManagement data={data} refresh={handleRefresh}></CapManagement>}

            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}

export async function getServerSideProps() {
  const { client, db } = await connectToDatabase()

  const isConnected = await client.isConnected()

  const projects = await db.collection("projects").find({}).toArray()
  const languages = await db.collection("languages").find({}).toArray()
  const lobs = await db.collection("lobs").find({}).toArray()
  const capPlans = await db.collection("capPlans").find({}).toArray()
  const weeks = await db.collection("weeks").find({}).toArray()
  const fields = await db.collection("fields").find({}).toArray()

  const props = { isConnected, projects, languages, lobs, weeks, capPlans, fields }

  return {
    props: JSON.parse(JSON.stringify(props))
  }
}