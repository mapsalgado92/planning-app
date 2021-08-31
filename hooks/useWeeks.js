
const useWeeks = (data) => {

  const getCurrentWeek = () => {
    let today = new Date()
    return data.weeks.find(week =>
      week.firstDate > today.toISOString()
    )
  }

  const getWeek = ({ value, type }) => {
    return data.weeks.find(week => week[type] === value)
  }

  const getWeekRange = (fromWeek, toWeek) => {
    if (toWeek) {
      return data.weeks.slice(data.weeks.indexOf(getWeek({ value: fromWeek, type: "code" })), 1 + data.weeks.indexOf(getWeek({ value: toWeek, type: "code" })))
    } else {
      return data.weeks.slice(data.weeks.indexOf(getWeek({ value: fromWeek, type: "code" })))
    }

  }

  return (
    {
      getCurrentWeek,
      getWeek,
      getWeekRange
    }
  )
}

export default useWeeks
