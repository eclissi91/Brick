
/****************************************************************************************
 *                                    Template generator
 * **************************************************************************************
 * Composes a string literal into a template element.
 * Concatenates placeholder ${ } that contains arrays of string with the text (mainly for <styles> import).
 * Extract config information in placeholders that contains objects: these can be ${{ID:"something"}} or ${{props:[strings]}}.
 * Can also be used as a tag for string literals directly.
 * 
 * Returns an object of the type:  {template: "...", props:["...",...], IDs:["..",...]}
 */

interface litRead_out {
    template: string, props: object, imports: HTMLTemplateElement[], IDs: string[] 
}
export function litRead(strings:Array<string>, ...keys:Array<any>):litRead_out{

    let output : {template: string, props: object, imports: HTMLTemplateElement[], IDs: string[] };
    output = {template: "", props:{}, imports: [], IDs: [] };

    if(strings.length <= keys.length) throw 'litRead error: you got strings >= keys, this is probably a bug.';
    
    if(strings.length === 1) {
        output.template = `${strings[0]}`;
        return output;
    }

    // from here there is at least one key
    let temp_str = "";
    strings.forEach( (str_val, index)=>{
        temp_str += str_val;

        if(index === keys.length) return;
        let key = keys[index];

        // cases:
        // it was an evaluated expression, just add it, otherwise if is an ID add to IDs
        if (typeof(key) === 'string'){ 
            if( key[0] === "#") {
                temp_str += ` id="${key.substring(1)}" `;
                output.IDs.push(key.substring(1));
            }
            else temp_str += key;            
        }
        
        else if(typeof(key) === 'object') {
            if(Array.isArray(key)) {

                for(let val of key) {  // FIXME: if contains string and template it would work... Do we want that?
                    if(typeof(val) === 'string') temp_str += ' ' + val ; 
                    else if( typeof(val) === 'object' && 'tagName' in val && val.tagName === 'TEMPLATE') {
                        output.imports.push(val);
                    }
                    else throw 'litRead supports only Arrays of string or <template>. ';
                }
            }
            else if('tagName' in key && key.tagName === 'TEMPLATE'){
                output.imports.push(key);
            }
            else if(Object.values(key).length > 0){
                // whitelisting, props should be like:    { key : ['string', 'string'], ... } or { key : "string"}
                for( let v of Object.values(key)){
                        if(typeof(v) === 'string' &&(v !== 'string' && v !== 'bool')) 
                            throw 'Support only props with string or bool values';
               
                        else if ( Array.isArray(v) && 
                            ( v.length !== 2 || typeof(v[0]) !== 'string' || 
                            ( typeof(v[1]) !== 'string' && typeof(v[1]) !== 'boolean') 
                            || (v[0] !=='string' && v[0] !== 'bool')))
                            throw "Supports only object of the type '<template>' or 'litRead-Props'={ key : ['string', 'string'], ... } ";
                        
                        else if( typeof(v) !== 'string' && !Array.isArray(v))
                            throw "Supports only object of the type '<template>' or 'litRead-Props'={ key : ['string', 'string'], ... } ";
                }
                output.props = key ; 
            }
            else throw "Supports only object of the type '<template>' or 'litRead-Props'={ key : ['string', 'string'], ... } ";

        }
        else throw "Placeholder ${"+typeof(key)+"} is not supported";
                
    });

    output.template = temp_str;
    // fix for template not appending child
    let tmpl = document.createElement('template');
    tmpl.innerHTML = temp_str;
    output.imports.push(tmpl);
    return output;
}


export function templateme(strings:Array<string>, ...keys:Array<any>) : HTMLTemplateElement {
    // NOTE on performance: it is a bit faster this way using insertBefore instead of appendChild,
    // because in that case there is an additional document.createElement for the additional appended child.

    let read_inputs = litRead(strings, ...keys);
    let out_template = document.createElement('template');
    out_template.innerHTML = read_inputs.template;
    // THIS DOES NOT WORK
    for (let tmpl of read_inputs.imports) {
        //out_template.insertBefore(tmpl.content.cloneNode(true), out_template.childNodes[0] || null);
        out_template.appendChild(tmpl.content.cloneNode(true)); // FIXME: cannot add child totemplate 

    }

    Object.defineProperty(out_template,'_props', read_inputs.props);
    Object.defineProperty(out_template,'_IDs', read_inputs.IDs);

    return out_template;
}   

export function brick(strings:Array<string>, ...keys:Array<any>) : Function {

    let litOut = litRead(strings,...keys);

    return (BaseClass:any) : any => class extends BaseClass {
        

        static get observedAttributes() {
            return Object.keys(litOut.props);
        }

        constructor(){
            super();

            this._props = litOut.props;
            let shadowRoot = this.attachShadow({mode: 'open'});
            for (let tmpl of litOut.imports) {
                shadowRoot.appendChild(tmpl.content.cloneNode(true));
            }

            let ids : {string: Element};  // fixme
            ids = {};
            for (let id of litOut.IDs){
                ////console.log('loop id: ', id);
                ids[id] = shadowRoot.getElementById(id);
                ////console.log('----> ', ids[id]);


            }
            this.shadowRoot['ids'] = ids;
            this.shadowRoot.qs = this.shadowRoot.querySelector;
            this.swr = this.shadowRoot;

            this.setProps();
        }
        


        setProps() {
            ////console.log('loooping over props');
            // define getters and setters for list of properties
            for (let prop in this._props) {
                Object.defineProperty(this, prop, {
                    set: (val) => { this.setAttribute(prop, val); },
                    get: () => { return this.getAttribute(prop); }
                });
            }
            ////console.log('prop_loop end');
            ////console.log('setProps shadow is: ', this.shadowRoot);
        }

        connectedCallback() {
            if(this.hasOwnProperty('connectedCallback') )super.connectedCallback();

            for (let prop in this._props) {
                //////console.log('attr ', prop);
                //////console.log('does have? ', this.hasAttribute(prop));
                if (!this.hasAttribute(prop) && Array.isArray(this._props[prop]) ) this.setAttribute(prop, this._props[prop][1]);
            }
        }

        attributeChangedCallback(name:string, oldVal:any, newVal:any) {
            const hasValue = newVal !== null;
            const updateMe = (hasValue && oldVal !== newVal);
        
            //////console.log('attribute changed: ' + name + " old " + oldVal + " new " + newVal);
            if (updateMe && this._props.hasOwnProperty(name) && this.hasOwnProperty('update_'+name)) {
              this['update_'+name](newVal);
            }
        }
        

    };
        
}
    
  