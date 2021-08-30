import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap"

const CapacityViewer = ({ capacity, data }) => {
  return (
    <div style={{ overflowX: "scroll" }} className="d-flex flex-row text-nowrap text-center w-100 ">
      <div className="d-flex flex-column bg-white sticky-horizontal border-end  border-dark text-end">
        <h6 className="sticky-header-2 bg-primary text-white text-center mb-0 py-1 px-2">Field</h6>
        {data.fields && data.fields.sort((a, b) => {
          let sortOrder = {
            capacity: 1,
            headcount: 2,
            training: 3,
            target: 4,
            forecast: 5
          }
          if (sortOrder[a.type] > sortOrder[b.type]) {
            return 1
          } else if (sortOrder[a.type] < sortOrder[b.type]) {
            return -1
          } else {
            return 0
          }
        }).map(field => <span className={field.type === "capacity" ? "text-danger border-bottom" : "border-bottom"} key={field.internal}>{field.external}
          <OverlayTrigger
            overlay={
              <Tooltip>
                {field.description}
              </Tooltip>
            }
            placement="right"
          >
            <span className="mx-2">( i )</span>
          </OverlayTrigger>
        </span>)}
      </div>
      {
        capacity.output && capacity.output.map(weekly => <div key={weekly.week.code} className="d-flex flex-column">
          <h6 className={"sticky-header-1 text-white border-end border-dark py-1 px-2 p-sticky mb-0 " + (data.weeks.find(week => {
            let today = new Date()
            return week.firstDate > today.toISOString()
          }).code === weekly.week.code ? "bg-danger" : "bg-dark")}>
            {weekly.week.firstDate.split("T")[0]}
          </h6>

          {data.fields && data.fields.sort((a, b) => {
            let sortOrder = {
              capacity: 1,
              headcount: 2,
              training: 3,
              target: 4,
              forecast: 5
            }
            if (sortOrder[a.type] > sortOrder[b.type]) {
              return 1
            } else if (sortOrder[a.type] < sortOrder[b.type]) {
              return -1
            } else {
              return 0
            }
          }).map((field, index) => <span className={"border-bottom border-light " + (index % 2 === 0 ? "bg-light " : " ") + ((Math.round(weekly[field.internal] * 100) / 100) > 0 ? "text-primary" : (Math.round(weekly[field.internal] * 100) / 100) < 0 ? "text-danger" : "text-secondary")} key={field.internal + weekly.week.code}>{weekly[field.internal] ? Math.round(weekly[field.internal] * 100) / 100 : weekly[field.internal] === 0 ? 0 : "-"}</span>)}
          {weekly.Comment && <OverlayTrigger
            overlay={
              <Tooltip>
                <p style={{ whiteSpace: "break-spaces" }} className="m-0 text-start">{weekly.Comment}</p>
              </Tooltip>
            }
            placement="top"
          >
            <Badge className="m-2 bg-danger">( i )</Badge>
          </OverlayTrigger>}
        </div>)
      }
    </div >
  )
}

export default CapacityViewer
