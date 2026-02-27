document.addEventListener('DOMContentLoaded',function(){
  var header=document.querySelector('.header');
  var mobileToggle=document.querySelector('.mobile-toggle');
  var navMenu=document.querySelector('.nav__menu');
  var overlay=document.querySelector('.mobile-overlay');
  var dropdowns=document.querySelectorAll('.nav__dropdown');
  var faqItems=document.querySelectorAll('.faq-item');
  var animElements=document.querySelectorAll('.animate-on-scroll');
  var counters=document.querySelectorAll('[data-count]');
  var counted=false;

  function handleScroll(){
    if(!header)return;
    if(window.scrollY>50){
      header.classList.remove('header--transparent');
      header.classList.add('header--solid');
    }else if(header.dataset.transparent==='true'){
      header.classList.add('header--transparent');
      header.classList.remove('header--solid');
    }
  }
  handleScroll();
  window.addEventListener('scroll',handleScroll,{passive:true});

  function closeMenu(){
    if(mobileToggle)mobileToggle.classList.remove('active');
    if(navMenu)navMenu.classList.remove('active');
    if(overlay)overlay.classList.remove('active');
    document.body.style.overflow='';
  }

  if(mobileToggle){
    mobileToggle.addEventListener('click',function(){
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      if(overlay)overlay.classList.toggle('active');
      document.body.style.overflow=navMenu.classList.contains('active')?'hidden':'';
    });
  }
  var menuClose=document.querySelector('.nav__menu-close');
  if(menuClose){
    menuClose.addEventListener('click',closeMenu);
  }
  if(overlay){
    overlay.addEventListener('click',closeMenu);
  }
  if(navMenu){
    navMenu.querySelectorAll('.nav__link').forEach(function(link){
      link.addEventListener('click',closeMenu);
    });
    navMenu.querySelectorAll('.nav__dropdown-menu a').forEach(function(link){
      link.addEventListener('click',closeMenu);
    });
  }

  dropdowns.forEach(function(dd){
    var toggle=dd.querySelector('.nav__dropdown-toggle');
    if(!toggle)return;
    toggle.addEventListener('click',function(e){
      e.stopPropagation();
      var wasActive=dd.classList.contains('active');
      dropdowns.forEach(function(d){d.classList.remove('active')});
      if(!wasActive)dd.classList.add('active');
    });
  });
  document.addEventListener('click',function(){
    dropdowns.forEach(function(d){d.classList.remove('active')});
  });

  faqItems.forEach(function(item){
    var q=item.querySelector('.faq-item__question');
    if(!q)return;
    q.addEventListener('click',function(){
      var wasActive=item.classList.contains('active');
      faqItems.forEach(function(fi){fi.classList.remove('active')});
      if(!wasActive)item.classList.add('active');
    });
  });

  function animateCounters(){
    counters.forEach(function(el){
      var target=parseInt(el.dataset.count,10);
      var suffix=el.dataset.suffix||'';
      var prefix=el.dataset.prefix||'';
      var duration=1600;
      var start=0;
      var startTime=null;
      function step(timestamp){
        if(!startTime)startTime=timestamp;
        var progress=Math.min((timestamp-startTime)/duration,1);
        var eased=1-Math.pow(1-progress,3);
        var current=Math.floor(eased*target);
        el.textContent=prefix+current.toLocaleString()+suffix;
        if(progress<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  var observerOptions={threshold:0.15,rootMargin:'0px 0px -50px 0px'};
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },observerOptions);
  animElements.forEach(function(el){observer.observe(el)});

  var counterObserver=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting&&!counted){
        counted=true;
        animateCounters();
        counterObserver.disconnect();
      }
    });
  },{threshold:0.3});
  counters.forEach(function(el){counterObserver.observe(el)});

  var filterBtns=document.querySelectorAll('.blog-filter-btn');
  var blogCards=document.querySelectorAll('.blog-card[data-category]');
  var paginationEl=document.querySelector('.pagination');
  filterBtns.forEach(function(btn){
    btn.addEventListener('click',function(){
      filterBtns.forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      var filter=btn.dataset.filter;
      blogCards.forEach(function(card){
        if(filter==='All'||card.dataset.category===filter){
          card.style.display='';
        }else{
          card.style.display='none';
        }
      });
      if(paginationEl){
        paginationEl.style.display=filter==='All'?'':'none';
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var href=this.getAttribute('href');
      if(!href||href==='#')return;
      try{
        var target=document.querySelector(href);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth',block:'start'});
        }
      }catch(err){}
    });
  });
});
