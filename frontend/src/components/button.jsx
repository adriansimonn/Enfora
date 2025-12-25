export default function Button({ children, onClick, variant = 'primary' }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition'

  const styles = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }

  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  )
}