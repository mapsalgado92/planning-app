const SQLTable = ({ input, title }) => {

  return (
    <div className="d-flex flex-column align-items-center text-center ">
      <span className="h3">{title ? title : "DATA VIEWER"}
        <button className="ms-3 btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(`${[input.data.header, ...input.data.entries].map(row => row.join("\t")).join("\n")}`) }}>Copy to Clipboard</button>
      </span>
      <div className="sql-scroll">
        {input.isConverted && (input.data.entries.length > 0) ?
          <table className="table table-striped ">
            <thead >
              <tr className="bg-dark text-light header">
                {input.data.header.map((item) =>
                  <th scope="col" className="header" key={"header-" + item}>{item}</th>
                )}
              </tr>
            </thead>

            <tbody >
              {input.data.entries.map((entry, index1) => {
                return <tr key={"entry-" + index1}>
                  {entry.map((field, index2) =>
                    <td key={"field-" + field + index1 + index2}>{field}</td>
                  )}
                </tr>
              }
              )}
            </tbody>

          </table> :
          <span>Waiting for Data</span>}
      </div>
    </div>
  )
}

export default SQLTable
