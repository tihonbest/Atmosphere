(() => {
  const clock=document.querySelector('#clock');
  const seconds=document.querySelector('#seconds');
  const date=document.querySelector('#date');
  const greeting=document.querySelector('#greeting');
  const dateFormat=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  let previousSecond=null;
  function tick(){
    const now=new Date();
    clock.textContent=new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
    const currentSecond=String(now.getSeconds()).padStart(2,'0');
    if(currentSecond!==previousSecond){
      seconds.textContent=currentSecond;
      if(previousSecond!==null){
        seconds.classList.remove('flip');
        void seconds.offsetWidth;
        seconds.classList.add('flip');
      }
      previousSecond=currentSecond;
    }
    date.textContent=dateFormat.format(now).replace(/^./,c=>c.toLocaleUpperCase('ru-RU'));
    const h=now.getHours();
    greeting.textContent=h<5?'ПОЗДНИЙ ВЕЧЕР':h<12?'ДОБРОЕ УТРО':h<18?'ХОРОШЕГО ДНЯ':'ДОБРЫЙ ВЕЧЕР';
  }
  tick();
  setInterval(tick,1000);
})();