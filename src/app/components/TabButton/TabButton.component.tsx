export default function TabButtonComponent({ tab, title, onClick, cssCls }) {
  return (
    <li>
      <a href={'#'} className={cssCls} onClick={onClick}>
        {title}
      </a>
    </li>
  )
}
