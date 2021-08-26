import Link from 'next/link'


const Header = () => {

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/"><a className="navbar-brand text-danger">PLANNING APP</a></Link>

        <ul className="navbar-nav mr-auto d-flex flex-row align-items-center">


          <li className="nav-item">
            <Link href="/management" ><a className="nav-link mx-3 border-bottom">Management</a></Link>
          </li>

          <li className="nav-item">
            <Link href="/entries" ><a className="nav-link mx-3 border-bottom">Entries</a></Link>
          </li>
          <li className="nav-item">
            <Link href="/capacity" ><a className="nav-link mx-3 border-bottom" >Capacity</a></Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Header
