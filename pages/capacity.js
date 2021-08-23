import Head from 'next/head'
import { useState } from 'react'
import { Row, Col, ListGroup, Button, Container, Form, DropdownButton, InputGroup } from 'react-bootstrap'
import SQLTable from '../components/capacity/SQLTable'
import { connectToDatabase } from '../lib/mongodb'

const Capacity = (props) => {
  const [data, setData] = useState(props)
  const [selected, setSelected] = useState({})
  const [formInfo, setFormInfo] = useState({ toWeek: "2021w10" })
  const [capacity, setCapacity] = useState([])
  const [output, setOutput] = useState(null)

  const headcountFields = [
    "attrition",
    "moveIN",
    "moveOUT",
    "loaIN",
    "loaOUT",
    "rwsIN",
    "rwsOUT"
  ]

  const trainingFields = [
    "trCommit",
    "trGap",
    "trAttrition",
    "trWeeks",
    "ocpWeeks"
  ]

  const targetFields = [
    "billable",
    "requirements",
    "tgAHT",
    "tgSL"
  ]

  const forecastFields = [
    "fcAttrition",
    "fcTrAttrition",
    "fcVolumes",
    "fcAHT",
    "fcRequirements"
  ]

  const capacityFields = [
    "totalHC",
    "totalFTE",
    "billableFTE",
    "expectedFTE",
    "billVar",
    "exBillVar",
    "reqVar",
    "exReqVar",
    "requiredFTE",
    "attrPercent",
    "trainees"
  ]

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

  const handleGenerate = async () => {

    let capPlan = selected.capPlan
    let entries = await fetch(`api/capEntries/capPlan=${capPlan._id}`).then(data => data.json()).catch()

    let weeks = data.weeks.slice(data.weeks.indexOf(data.weeks.find(week => week.code === capPlan.firstWeek)), 1 + data.weeks.indexOf(data.weeks.find(week => week.code === formInfo.toWeek)))

    //console.log(project, lob, capPlan)

    console.log("CAPACITY ENTRIES", entries)

    let today = new Date()

    const thisWeek = weeks.find(week => {
      return week.firstDate > today.toISOString()
    }
    )

    if (thisWeek) {
      console.log(thisWeek.code)
    } else {
      console.log("Current week not in range!")
      return -1
    }


    //GENERATE CURRENT
    let current = {
      totalHC: parseFloat(capPlan.startingHC),
      totalFTE: parseFloat(capPlan.startingHC),
      entry: entries.find(entry => entry.week === capPlan.firstWeek),
      inTraining: []
    }

    if (!current.entry) {
      console.log("NO ENTRY FOR FIRST WEEK!")
      return null
    }

    current.trWeeks = parseInt(current.entry.trWeeks)
    current.ocpWeeks = parseInt(current.entry.ocpWeeks)
    current.billableFTE = parseInt(current.entry.billable)

    let newPlan = weeks.map(week => {
      let entry = entries.find(entry => entry.week === week.code)

      let newPlanWeek = {
        totalHC: current.totalHC,
        totalFTE: current.totalFTE,
        expectedFTE: current.expectedFTE ? current.expectedFTE : null,
        billableFTE: current.billableFTE,
        requiredFTE: current.requiredFTE,
        trainees: 0,

      }

      if (week.code === thisWeek.code) {
        newPlanWeek.expectedFTE = current.totalFTE
      }


      if (entry && entry.attrition) {
        newPlanWeek.totalHC -= parseFloat(entry.attrition)
        newPlanWeek.totalFTE -= parseFloat(entry.attrition)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE -= parseFloat(entry.attrition))
        newPlanWeek.attrPercent = entry.attrition / current.totalHC * 100
      }

      if (entry && entry.moveOUT) {
        newPlanWeek.totalHC -= parseFloat(entry.moveOUT)
        newPlanWeek.totalFTE -= parseFloat(entry.moveOUT)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE -= parseFloat(entry.moveOUT))
      }

      if (entry && entry.loaOUT) {
        newPlanWeek.totalHC -= parseFloat(entry.loaOUT)
        newPlanWeek.totalFTE -= parseFloat(entry.loaOUT)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE -= parseFloat(entry.loaOUT))
      }

      if (entry && entry.rwsOUT) {
        newPlanWeek.totalFTE -= parseFloat(entry.rwsOUT)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE -= parseFloat(entry.rwsOUT))
      }

      if (entry && entry.moveIN) {
        newPlanWeek.totalHC += parseFloat(entry.moveIN)
        newPlanWeek.totalFTE += parseFloat(entry.moveIN)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE += parseFloat(entry.moveIN))
      }

      if (entry && entry.loaIN) {
        newPlanWeek.totalHC += parseFloat(entry.loaIN)
        newPlanWeek.totalFTE += parseFloat(entry.loaIN)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE += parseFloat(entry.loaIN))
      }

      if (entry && entry.rwsIN) {
        newPlanWeek.totalFTE += parseFloat(entry.rwsIN)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE += parseFloat(entry.rwsIN))
      }

      if (entry && entry.comment) {
        newPlanWeek.comment = entry.comment
      }

      if (entry && entry.billable) {
        newPlanWeek.billableFTE = parseFloat(entry.billable)
      }

      if (entry && entry.trWeeks) {
        current.trWeeks = parseFloat(entry.trWeeks)
      }

      if (entry && entry.trCommit) {
        current.inTraining.push({
          trCommit: parseFloat(entry.trCommit),
          trGap: entry.trGap ? parseFloat(entry.trGap) : 0,
          trAttrition: entry.trAttrition ? parseFloat(entry.trAttrition) : 0,
          weeksToLive: parseFloat(current.trWeeks) + 1
        })
      }

      current.inTraining.forEach(batch => {
        let trainingTotal = batch.trCommit + batch.trGap - batch.trAttrition
        if (batch.weeksToLive > 1) {
          newPlanWeek.trainees += trainingTotal
          batch.weeksToLive--
        } else if (batch.weeksToLive === 1) {
          newPlanWeek.totalHC += trainingTotal
          newPlanWeek.totalFTE += trainingTotal
          newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE += trainingTotal)
          batch.weeksToLive--
        }
      })

      if (entry && entry.fcAttrition && newPlanWeek.expectedFTE) {
        newPlanWeek.expectedFTE = newPlanWeek.expectedFTE * (1 - parseFloat(entry.fcAttrition))
      }

      //Calculations
      newPlanWeek.billableFTE && (newPlanWeek.billVar = newPlanWeek.totalFTE - newPlanWeek.billableFTE)
      newPlanWeek.expectedFTE && newPlanWeek.billableFTE && (newPlanWeek.exBillVar = newPlanWeek.expectedFTE - newPlanWeek.billableFTE)
      newPlanWeek.requiredFTE && (newPlanWeek.reqVar = newPlanWeek.totalFTE - newPlanWeek.requiredFTE)
      newPlanWeek.expectedFTE && newPlanWeek.requiredFTE && (newPlanWeek.exReqVar = newPlanWeek.expectedFTE - newPlanWeek.requiredFTE)

      current = { ...current, ...newPlanWeek }

      return { week, ...newPlanWeek, entry }
    })

    console.log(newPlan)

    setCapacity(newPlan)

    let outputHeaders = [...capacityFields]

    let outputData = newPlan.map(weekly =>
      [weekly.week.code, weekly.week.firstDate.split("T")[0], ...outputHeaders.map(header =>
        (weekly[header] || weekly[header] === 0) ? Math.round(weekly[header] * 10) / 10 : null
      )]
    )

    setOutput({
      data: {
        header: ["Week", "First Date", ...outputHeaders],
        entries: outputData
      },
      isConverted: true
    })
  }



  return (
    <>
      <Head>
        <title>Planning Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>

        <Container className="mt-4">
          <h1>Capacity</h1>
          <Form>
            <Form.Label as="h4">Selection</Form.Label>
            <InputGroup>
              <DropdownButton className="me-2" title={selected.project ? selected.project.name : "Select a Project"} disabled={data.projects === 0}>
                <ListGroup variant="flush">
                  {data.projects && data.projects.map(project =>
                    <ListGroup.Item key={project._id} action className="rounded-0 flush" onClick={(e) => { e.preventDefault(); handleSelect(project, "project") }}>
                      {project.name}
                    </ListGroup.Item>)}
                </ListGroup>
              </DropdownButton>


              <DropdownButton className="me-2" title={selected.lob ? selected.lob.name : "Select a LOB"} disabled={!selected.project}>
                <ListGroup variant="flush">
                  {selected.project && data.lobs.filter(lob => lob.project === selected.project._id) && data.lobs.filter(lob => lob.project === selected.project._id).map(lob =>
                    <ListGroup.Item key={lob._id} action className="rounded-0 flush" onClick={(e) => { e.preventDefault(); handleSelect(lob, "lob") }}>
                      {lob.name}
                    </ListGroup.Item>)}
                </ListGroup>
              </DropdownButton>

              <DropdownButton className="me-2" title={selected.capPlan ? selected.capPlan.name : "Select a Capacity Plan"} disabled={!selected.lob}>
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
            <DropdownButton variant="danger" className="me-2" title={selected.week ? selected.week.code + " - " + selected.week.firstDate.split("T")[0] : "Select a Week"} disabled={!selected.capPlan}>
              <ListGroup variant="flush">
                {selected.capPlan && data.weeks.slice(data.weeks.indexOf(data.weeks.find(week => week.code === selected.capPlan.firstWeek))) && data.weeks.slice(data.weeks.indexOf(data.weeks.find(week => week.code === selected.capPlan.firstWeek))).map(week =>
                  <ListGroup.Item key={week._id} action className="rounded-0 flush" variant={(selected.week && week.code === selected.week.code) ? "warning" : "light"} onClick={(e) => { e.preventDefault(); handleSelect(week, "week") }}>
                    {week.code + " - " + week.firstDate.split("T")[0]}
                  </ListGroup.Item>)}
              </ListGroup>
            </DropdownButton>

            <br />

            <Button onClick={handleGenerate} variant="dark" disabled={!selected.week}>GENERATE CAPACITY</Button>

          </Form>

          <br />
          {output &&
            <SQLTable input={output} title="Capacity View">

            </SQLTable>

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

  const props = { isConnected, projects, languages, lobs, weeks, capPlans }

  return {
    props: JSON.parse(JSON.stringify(props))
  }
}