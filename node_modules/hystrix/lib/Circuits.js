import _ from 'lodash';
import Circuit from './Circuit';

export default class Circuits {
  constructor(){
   super();
   this.cache = {};
  }

  get(){
   return this.cache;
  }

  findOne(name){
   return this.cache[name];
  }

  set(obj){
   this.cache = _.merge({},obj);
   return this.cache;
  }

  append(name){
   this.cache[name] = new Circuit({name});
   return this.cache[name];
  }
}
