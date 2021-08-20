import Head from 'next/head'
import { useState } from 'react'
import { Row, Col, ListGroup, Button, Container } from 'react-bootstrap'
import { connectToDatabase } from '../lib/mongodb'

const Capacity = (props) => {
  const [data, setData] = useState(props)
  const [selected, setSelected] = useState({ project: "60f9f1b3c1668d3236ad1a96", lob: "6118f4ffbe1a793f90084154", capPlan: "611d8220de21153d8c7ed396" })
  const [formInfo, setFormInfo] = useState({ toWeek: "2021w10" })
  const [capacity, setCapacity] = useState([])

  const handleGenerate = async () => {
    let project = data.projects.find(project => project._id === selected.project)
    let lob = data.lobs.find(lob => lob._id === selected.lob)
    let capPlan = data.capPlans.find(capPlan => capPlan._id === selected.capPlan)
    let entries = await fetch(`api/capEntries/capPlan=${selected.capPlan}`).then(data => data.json()).catch()

    let weeks = data.weeks.slice(data.weeks.indexOf(data.weeks.find(week => week.code === capPlan.firstWeek)), 1 + data.weeks.indexOf(data.weeks.find(week => week.code === formInfo.toWeek)))

    //console.log(project, lob, capPlan)

    console.log("ENTRIES", entries)

    console.log("WEEKS", weeks)

    //GENERATE CURRENT
    let current = {
      totalHC: parseFloat(capPlan.startingHC),
      totalFTE: parseFloat(capPlan.startingHC),
      entry: entries.find(entry => entry.week === capPlan.firstWeek),
      inTraining: []
    }

    if (!current.entry) {
      console.log("NO ENTRY FOR FIRST WEEK!")
    }

    current.trWeeks = parseInt(current.entry.trWeeks)
    current.ocpWeeks = parseInt(current.entry.ocpWeeks)
    current.billable = parseInt(current.entry.billable)

    let newPlan = weeks.map(week => {
      let entry = entries.find(entry => entry.week === week.code)

      let newPlanWeek = {
        totalHC: current.totalHC,
        totalFTE: current.totalFTE,
        trainees: 0,
        billable: current.billable
      }

      if (entry) {
        if (entry.attrition) {
          newPlanWeek.totalHC -= parseFloat(entry.attrition)
          newPlanWeek.totalFTE -= parseFloat(entry.attrition)
        }

        if (entry.moveOUT) {
          newPlanWeek.totalHC -= parseFloat(entry.moveOUT)
          newPlanWeek.totalFTE -= parseFloat(entry.moveOUT)
        }

        if (entry.loaOUT) {
          newPlanWeek.totalHC -= parseFloat(entry.loaOUT)
          newPlanWeek.totalFTE -= parseFloat(entry.loaOUT)
        }

        if (entry.rwsOUT) {
          newPlanWeek.totalFTE -= parseFloat(entry.rwsOUT)
        }

        if (entry.moveIN) {
          newPlanWeek.totalHC += parseFloat(entry.moveIN)
          newPlanWeek.totalFTE += parseFloat(entry.moveIN)
        }

        if (entry.loaIN) {
          newPlanWeek.totalHC += parseFloat(entry.moveIN)
          newPlanWeek.totalFTE += parseFloat(entry.moveIN)
        }

        if (entry.rwsIN) {
          newPlanWeek.totalFTE += parseFloat(entry.rwsIN)
        }

        if (entry.trCommit) {
          current.inTraining.push({
            trCommit: parseFloat(entry.trCommit),
            trGap: entry.trGap ? parseFloat(entry.trGap) : 0,
            trAttrition: entry.trAttrition ? parseFloat(entry.trAttrition) : 0,
            weeksToLive: parseFloat(current.trWeeks) + 1
          })
        }

        if (entry.comment) {
          newPlanWeek.comment = entry.comment
        }

        if (entry.billable) {
          newPlanWeek.billable = parseFloat(entry.billable)
        }
      }


      current.inTraining.forEach(batch => {
        let trainingTotal = batch.trCommit + batch.trGap - batch.trAttrition
        if (batch.weeksToLive > 1) {
          newPlanWeek.trainees += trainingTotal
          batch.weeksToLive--
        } else if (batch.weeksToLive === 1) {
          newPlanWeek.totalHC += trainingTotal
          newPlanWeek.totalFTE += trainingTotal
          batch.weeksToLive--
        }
      })

      current = { ...current, ...newPlanWeek }

      return { week, ...newPlanWeek, entry }
    })

    setCapacity(newPlan)
  }

  return (
    <>
      <Head>
        <title>Planning Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <Container className="mt-4">
          <Button onClick={handleGenerate}>Do me!</Button>
        </Container>


      </div>
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