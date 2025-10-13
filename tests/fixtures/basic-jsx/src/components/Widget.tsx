export default function Widget() {
  const later = Promise.resolve('Y');
  return (
    <>
      <div class="a" className="b">
        {['X', null, undefined, false, later]}
      </div>
    </>
  );
}
