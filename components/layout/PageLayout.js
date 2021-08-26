import Header from "./Header"
import Head from "next/dist/next-server/lib/head"


const PageLayout = (props) => {
  return (
    <>
      <Header />
      {props.children}
      <footer className="footer text-center mt-auto border-top container p-4">
        An app by <span className="text-danger">Mario Salgado</span>
      </footer>
    </>
  )
}

export default PageLayout
