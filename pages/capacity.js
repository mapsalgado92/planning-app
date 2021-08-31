import Head from 'next/head'
import { useState } from 'react'
import { ListGroup, Button, Container, Form, DropdownButton, InputGroup, Tabs, Tab } from 'react-bootstrap'
import SQLTable from '../components/capacity/SQLTable'
import { connectToDatabase } from '../lib/mongodb'
import useCapacity from '../hooks/useCapacity'
import CapacityViewer from '../components/capacity/CapacityViewer'
import useWeeks from '../hooks/useWeeks'

const Capacity = (props) => {
  const [data, setData] = useState(props)
  const [selected, setSelected] = useState({})
  const [formInfo, setFormInfo] = useState({})
  const capacity = useCapacity(data)

  const myWeeks = useWeeks(data)

  const handleSelect = async (item, type) => {

    if (type === "project") {
      setSelected({ project: item, lob: null, capPlan: null, week: null })
    } else if (type === "lob") {
      setSelected({ ...selected, lob: item, capPlan: null, week: null })
    } else if (type === "capPlan") {
      setSelected({ ...selected, capPlan: item, week: null })
    } else if (type === "week") {
      setSelected({ ...selected, week: item })
      setFormInfo({ ...formInfo, toWeek: item.code })
    }
  }


  return (
    <>
      <Head>
        <title>Planning App | Capacity</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>

        <Container className="mt-4">
          <h2 className="text-center text-danger">Capacity</h2>
          <Form>
            <Form.Label as="h4">Selection</Form.Label>
            <InputGroup>
              <DropdownButton size="sm" className="me-2" title={selected.project ? selected.project.name : "Select a Project"} disabled={data.projects === 0}>
                <ListGroup variant="flush">
                  {data.projects && data.projects.map(project =>
                    <ListGroup.Item key={project._id} action className="rounded-0 flush" onClick={(e) => { e.preventDefault(); handleSelect(project, "project") }}>
                      {project.name}
                    </ListGroup.Item>)}
                </ListGroup>
              </DropdownButton>


              <DropdownButton size="sm" className="me-2" title={selected.lob ? selected.lob.name : "Select a LOB"} disabled={!selected.project}>
                <ListGroup variant="flush">
                  {selected.project && data.lobs.filter(lob => lob.project === selected.project._id) && data.lobs.filter(lob => lob.project === selected.project._id).map(lob =>
                    <ListGroup.Item key={lob._id} action className="rounded-0 flush" onClick={(e) => { e.preventDefault(); handleSelect(lob, "lob") }}>
                      {lob.name}
                    </ListGroup.Item>)}
                </ListGroup>
              </DropdownButton>

              <DropdownButton size="sm" className="me-2" title={selected.capPlan ? selected.capPlan.name : "Select a Capacity Plan"} disabled={!selected.lob}>
                <ListGroup variant="flush">
                  {selected.lob && data.capPlans.filter(capPlan => capPlan.lob === selected.lob._id) && data.capPlans.filter(capPlan => capPlan.lob === selected.lob._id).map(capPlan =>
                    <ListGroup.Item key={capPlan._id} action className="rounded-0 flush" onClick={(e) => { e.preventDefault(); handleSelect(capPlan, "capPlan") }}>
                      {capPlan.name}
                    </ListGroup.Item>)}
                </ListGroup>
              </DropdownButton>
            </InputGroup>

            <br></br>

            <Form.Label as="h4">To Week</Form.Label>
            <DropdownButton size="sm" variant="danger" className="me-2" title={selected.week ? selected.week.code + " - " + selected.week.firstDate.split("T")[0] : "Select a Week"} disabled={!selected.capPlan}>
              <ListGroup variant="flush">
                {selected.capPlan && myWeeks.getWeekRange(selected.capPlan.firstWeek) && myWeeks.getWeekRange(selected.capPlan.firstWeek).map(week =>
                  <ListGroup.Item key={week._id} action className={"rounded-0 flush" + (myWeeks.getCurrentWeek().code === week.code ? " border border-danger text-danger" : "")} variant={(selected.week && week.code === selected.week.code) ? "warning" : "light"} onClick={(e) => { e.preventDefault(); handleSelect(week, "week") }}>
                    {week.code + " - " + week.firstDate.split("T")[0]}
                  </ListGroup.Item>)}
              </ListGroup>
            </DropdownButton>

            <br />

            <Button size="sm" onClick={() => capacity.generate(selected.capPlan, formInfo.toWeek)} variant="dark" disabled={!selected.week}>GENERATE CAPACITY</Button>

          </Form>

          <br />
          {capacity.output &&
            <CapacityViewer data={data} capacity={capacity} outputType={"output"}></CapacityViewer>
          }

          <br />

          {capacity.output &&

            <Tabs >

              <Tab title="Capacity" disabled={!capacity.output} eventKey="capacity">
                <br />
                {capacity.output &&
                  <SQLTable input={capacity.getTable(data.fields.filter(field => field.type === "capacity"))} title="Capacity View" />
                }

              </Tab>
              <Tab title="Headcount" disabled={!capacity.output} eventKey="entries">
                <br />
                {capacity.output &&
                  <SQLTable input={capacity.getTable(data.fields.filter(field => field.type === "headcount"))} title="Headcount View" />
                }
              </Tab>
              <Tab title="Target + Forecast" disabled={!capacity.output} eventKey="targetForecast">
                <br />
                {capacity.output &&
                  <SQLTable input={capacity.getTable(data.fields.filter(field => field.type === "target" || field.type === "forecast"))} title="Target + Forecast View" />
                }
              </Tab>

            </Tabs>

          }


          <br />


        </Container>


      </main>
    </>
  )
}

export default Capacity

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