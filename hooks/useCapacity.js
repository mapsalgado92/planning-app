import { useState } from "react"
import useWeeks from "./useWeeks"


const useCapacity = (data) => {

  const [output, setOutput] = useState(null)
  const [aggOutput, setAggOutput] = useState(null)

  let myWeeks = useWeeks(data)

  const generate = async (capPlan, toWeek) => {

    let entries = await fetch(`api/capEntries/capPlan=${capPlan._id}`).then(data => data.json()).catch()

    console.log("ENTRIES", entries)

    let weeks = myWeeks.getWeekRange(capPlan.firstWeek, toWeek)

    console.log("WEEKS", weeks)

    const thisWeek = myWeeks.getCurrentWeek()



    //GENERATE CURRENT
    let current = {
      totalHC: parseFloat(capPlan.startingHC),
      totalFTE: parseFloat(capPlan.startingHC),
      entry: entries.find(entry => entry.week === capPlan.firstWeek),
      inTraining: [],
      isFuture: false
    }

    if (!current.entry) {
      console.log("NO ENTRY FOR FIRST WEEK!")
      return null
    }

    current.trWeeks = parseInt(current.entry.trWeeks)
    current.ocpWeeks = parseInt(current.entry.ocpWeeks)
    current.billableFTE = parseInt(current.entry.billable)
    current.fcTrAttrition = parseFloat(current.entry.fcTrAttrition)

    let newPlan = weeks.map(week => {
      let entry = entries.find(entry => entry.week === week.code)

      let newPlanWeek = {
        totalHC: current.totalHC,
        totalFTE: current.totalFTE,
        expectedFTE: current.expectedFTE ? current.expectedFTE : thisWeek && thisWeek.code === week.code && current.totalFTE,
        billableFTE: current.billableFTE,
        requiredFTE: current.requiredFTE,
        trainees: 0,
        nesting: 0,
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
          weeksToLive: parseFloat(current.trWeeks) + 1,
          weeksToProd: parseFloat(current.ocpWeeks) + 1
        })
      }

      if (entry && entry.fcTrAttrition) {
        current.fcTrAttrition = parseFloat(entry.fcTrAttrition)
      }

      current.inTraining.forEach(batch => {
        let trainingTotal = batch.trCommit + batch.trGap - batch.trAttrition

        if (batch.weeksToLive > 1) {
          newPlanWeek.trainees += trainingTotal
          batch.weeksToLive--
        } else if (batch.weeksToLive === 1) {
          newPlanWeek.totalHC += trainingTotal
          newPlanWeek.totalFTE += trainingTotal
          if (current.isFuture && current.fcTrAttrition && newPlanWeek.expectedFTE) {
            newPlanWeek.expectedFTE += trainingTotal * (1 - current.fcTrAttrition)
          } else {
            newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE += trainingTotal)
          }

          batch.weeksToLive--
        }

        if (batch.weeksToLive < 1 && batch.weeksToProd > 1) {
          newPlanWeek.nesting += trainingTotal
          batch.weeksToProd--
        }
      })

      if (entry && entry.fcAttrition && current.isFuture) {
        newPlanWeek.expectedFTE = newPlanWeek.expectedFTE * (1 - parseFloat(entry.fcAttrition))
      }

      if (thisWeek && week.code === thisWeek.code) {
        current.isFuture = true
      }


      //Calculations
      newPlanWeek.billableFTE && (newPlanWeek.billVar = newPlanWeek.totalFTE - newPlanWeek.billableFTE)
      newPlanWeek.expectedFTE && newPlanWeek.billableFTE && (newPlanWeek.exBillVar = newPlanWeek.expectedFTE - newPlanWeek.billableFTE)
      newPlanWeek.requiredFTE && (newPlanWeek.reqVar = newPlanWeek.totalFTE - newPlanWeek.requiredFTE)
      newPlanWeek.expectedFTE && newPlanWeek.requiredFTE && (newPlanWeek.exReqVar = newPlanWeek.expectedFTE - newPlanWeek.requiredFTE)

      current = { ...current, ...newPlanWeek }

      return { ...newPlanWeek, ...entry, week }
    })

    setOutput(newPlan)

    return newPlan

  }

  const aggregate = async (capPlans, fromWeek, toWeek) => {
    setAggOutput(null)
    let aggregated = myWeeks.getWeekRange(fromWeek.code, toWeek.code).map(week => { return { week: week } })

    for await (let capPlan of capPlans) {
      if (myWeeks.getWeekRange(toWeek, capPlan.firstWeek) === []) {
        console.log("Cap Plan not in Range")
        return -1
      } else {
        let capacity = await generate(capPlan, toWeek.code)

        aggregated = await aggregated.map(agg => {
          let weekly = capacity.find(weekly => weekly.week.code === agg.week.code)
          if (weekly) {
            let newAgg = { ...agg }
            data.fields.forEach(field => {
              if (field.aggregatable && weekly[field.internal]) {
                if (newAgg[field.internal] || newAgg[field.internal] === 0) {
                  newAgg[field.internal] = parseFloat(newAgg[field.internal]) + parseFloat(weekly[field.internal])
                } else {
                  newAgg[field.internal] = parseFloat(weekly[field.internal])
                }
              }
            })

            //attrPercentException
            if (newAgg.attrition) {
              newAgg.attrPercent = newAgg.attrition / newAgg.totalHC
            }

            return newAgg
          } else {
            return agg
          }
        })
      }
    }
    setAggOutput(aggregated)
  }

  const getTable = (fields) => {
    let headers = fields.map(field => field.internal)

    let tableData = output.map(weekly =>
      [weekly.week.code, weekly.week.firstDate.split("T")[0], ...headers.map(header =>
        (weekly[header] || weekly[header] === 0) ? Math.round(weekly[header] * 100) / 100 : null
      )]
    )

    return ({
      data: {
        header: ["Week", "First Date", ...fields.map(field => field.external)],
        entries: tableData
      },
      isConverted: true
    })
  }

  const getAggregatedTable = (fields) => {
    let headers = fields.map(field => field.internal)

    let tableData = aggOutput.map(weekly =>
      [weekly.week.code, weekly.week.firstDate.split("T")[0], ...headers.map(header =>
        (weekly[header] || weekly[header] === 0) ? Math.round(weekly[header] * 100) / 100 : null
      )]
    )

    return ({
      data: {
        header: ["Week", "First Date", ...fields.map(field => field.external)],
        entries: tableData
      },

      isConverted: true
    })
  }

  return ({
    generate,
    aggregate,
    getTable,
    getAggregatedTable,
    output,
    aggOutput
  })
}

export default useCapacity
