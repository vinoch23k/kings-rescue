// AI-assisted implementation. See AI_DISCLOSURE.md.
export class EventBus extends EventTarget {emit(name,detail){this.dispatchEvent(new CustomEvent(name,{detail}));}on(name,listener){this.addEventListener(name,event=>listener(event.detail));}}
