import { useState } from "react"
import useWeeks from "./useWeeks"


const useCapacity = (data) => {

  const [output, setOutput] = useState(null)
  const [aggOutput, setAggOutput] = useState(null)
  const [aggTotals, setAggTotals] = useState(null)
  const [status, setStatus] = useState(null)


  let myWeeks = useWeeks(data)

  const generate = async (capPlan, toWeek) => {

    let entries = await fetch(`api/capEntries/capPlan=${capPlan._id}`).then(data => data.json()).catch()

    let weeks = toWeek ? myWeeks.getWeekRange(capPlan.firstWeek, toWeek) : data.weeks

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
        firstDate: week.firstDate.split("T")[0],
        totalHC: current.totalHC,
        totalFTE: current.totalFTE,
        billableFTE: current.billableFTE,
        requiredFTE: current.requiredFTE,
        trainees: 0,
        nesting: 0,
      }

      //Set up Expected FTE

      if (current.expectedFTE) {
        newPlanWeek.expectedFTE = current.expectedFTE
      } else if (thisWeek && thisWeek.code === week.code) {
        newPlanWeek.expectedFTE = current.totalFTE
      }

      if (entry && entry.attrition) {
        newPlanWeek.totalHC -= parseFloat(entry.attrition)
        newPlanWeek.totalFTE -= parseFloat(entry.attrition)
        newPlanWeek.expectedFTE && (newPlanWeek.expectedFTE -= parseFloat(entry.attrition))
        newPlanWeek.attrPercent = Math.round(entry.attrition / current.totalHC * 100) / 100
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

      if (newPlanWeek.expectedFTE) {
        newPlanWeek.expectedFTE = Math.round(newPlanWeek.expectedFTE * 100) / 100
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
    setStatus("Aggregating...")
    let aggregated = myWeeks.getWeekRange(fromWeek.code, toWeek.code).map(week => { return { week: week, firstDate: week.firstDate.split("T")[0] } })

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
              if (field.aggregatable && (weekly[field.internal] || weekly[field.internal] === 0)) {
                if (newAgg[field.internal] || newAgg[field.internal] === 0) {
                  newAgg[field.internal] = Math.round((newAgg[field.internal] + parseFloat(weekly[field.internal])) * 100) / 100
                } else {
                  newAgg[field.internal] = Math.round(parseFloat(weekly[field.internal]) * 100) / 100
                  console.log("FIRST WEEKLY", newAgg[field.internal])
                }
              }
            })

            //attrPercentException
            if (newAgg.attrition) {
              newAgg.attrPercent = Math.round(newAgg.attrition / newAgg.totalHC * 100) / 100
            }

            return newAgg
          } else {
            return agg
          }
        })
      }
    }

    //SUMS AND AVERAGES

    let sumFields = data.fields.filter(field => field.aggSum)
    let averageFields = data.fields.filter(field => field.aggAverage)

    //Build Sums and Average arrays

    let sums = sumFields ? sumFields.map(field => {
      let newTotal = 0

      for (let i = 0; i < aggregated.length; i++) {
        newTotal += aggregated[i][field.internal] || 0
      }

      return { field, value: newTotal }
    }) : []

    console.log("SUMS", sums)

    let averages = averageFields ? averageFields.map(field => {
      let newTotal = 0

      for (let i = 0; i < aggregated.length; i++) {
        newTotal += aggregated[i][field.internal] || 0
      }

      return { field, value: newTotal / aggregated.length }
    }) : []

    console.log("AVERAGES", averages)

    //Special Case attrition %

    let attritionSum = sums.find(sum => sum.field.internal === "attrition")

    let totalHCAvg = averages.find(avg => avg.field.internal === "totalHC")

    let attritionRate = { field: data.fields.find(field => field.internal === "attrPercent"), value: null }

    if (attritionSum && totalHCAvg) {
      attritionRate.value = attritionSum.value / totalHCAvg.value
    } else {
      attritionRate.value = 0
    }

    console.log("ATTR RATE", attritionRate.value * 100, "%")

    //Special Case Training Attrition %

    let trAttritionRate = {
      field: {
        internal: "trAttritionRate",
        external: "Tr. Attrition Rate",
        _id: "trAttrition-id"
      },
      value: sums.find(sum => sum.field.internal === "trAttrition").value / (sums.find(sum => sum.field.internal === "trCommit").value + sums.find(sum => sum.field.internal === "trGap").value)
    }


    setAggTotals({ sums, averages, calculated: [attritionRate, trAttritionRate] })
    setAggOutput(aggregated)
    setStatus(null)

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

  const rawUpdate = async (capPlan) => {
    let language = data.languages.find(language => language._id === capPlan.language)
    console.log("LANGUAGE", language)
    if (capPlan.active) {
      let rawData = await generate(capPlan)
      if (rawData.length > 0) {
        fetch(`/api/raw/capPlan=${capPlan._id}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            item: {
              capPlan: capPlan._id,
              capPlanName: capPlan.name,
              languageType: language.type,
              laguageSet: language.set,
              rawData
            }
          })
        })
      } else {
        console.log("CAPACITY PLAN IS NOT ACTIVE")
      }
    }

    console.log("Completely Updted Raw")

  }

  return ({
    generate,
    aggregate,
    getTable,
    getAggregatedTable,
    rawUpdate,
    aggTotals,
    output,
    aggOutput,
    status
  })
}

export default useCapacity
