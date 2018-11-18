import {brick} from '../build/brick.js'



export default function (){

    let counter = "";
    let style = document.createElement('template');
    style.innerHTML=`<style> h1{color:blue;} h2{color:red;} h3{color:green;} </style>`;
    let h1 = document.createElement('template');
    h1.innerHTML=`<h1> test </h1>`;
    let h2 = document.createElement('template');
    h2.innerHTML=`<h2> smaller test </h2>`;
    
    let mixin = brick`<h3>${'ciao'}</h3> ${""}
                    <h4${'#cocco'}> Ciao</h4>
                    <h5${'#hey'}>ciao</h5>

                    ${style} 
                    ${[h1,h2]}
                    ${'|* updatable | not_updatable *|'} `;

    customElements.define('test-element',class extends mixin(HTMLElement){
        update_ciao(newval){
            counter = newval;
        }
        
    });

    let el = document.createElement('test-element');


    describe('Brick',()=>{

        describe('ShadowDom',()=>{
            it('Has shadowdom well defined and all elements appears in right order',()=>{
                chai.assert.equal(el.tagName, 'TEST-ELEMENT', 'wrong tag name');
                chai.assert.equal(el.shadowRoot.mode, "open", 'has shadow dom');
                chai.assert.equal(el.shadowRoot.firstChild.tagName, "STYLE", 'correctfirst child');
                chai.assert.include(el.shadowRoot.children[0], { tagName:"STYLE"},  'child 0 fail');
                chai.assert.include(el.shadowRoot.children[1], { tagName:"H1"},  'child 1 fail');
                chai.assert.include(el.shadowRoot.children[2], { tagName:"H2"},  'child 2 fail');
                chai.assert.include(el.shadowRoot.children[3], { tagName:"H3"},  'child 3 fail');
                chai.assert.include(el.shadowRoot.children[4], { tagName:"H4", id:"cocco"},  'child 4 fail');
                chai.assert.include(el.shadowRoot.children[5], { tagName:"H5", id:'hey'},  'child 5 fail');
                chai.assert.equal(el.shadowRoot.children.length, 6 ,  'elements number differ');

                chai.assert.property(el,"swr", 'has shortcut for shadow');
                chai.assert.property(el.shadowRoot,"qs", 'has shortcut for query selector');
                chai.assert.property(el.shadowRoot,"ids", 'has shortcut for ids');
            }); 
        });

        describe('IDs',()=>{
            it('has ID quick reference well defined, and no more no less than 2.',()=>{
                chai.assert.include(el.shadowRoot.ids.cocco, {tagName:'H4', id:"cocco"}, 'ID reference 1 ok');
                chai.assert.include(el.shadowRoot.ids.hey, {tagName:'H5', id:"hey"}, 'ID reference 2 ok');
                chai.assert.equal(Object.keys(el.shadowRoot.ids).length, 2, 'only 2 IDs no more, no less');
            });
            
        });

        describe('Attribute',()=>{
            // has the attributes
            // reflect the atribute properly from javascrit
            // reflect the atribute properly from HTML
            // behaviour: runs on update when defined
            // behaviour: skip when on update is not defined

        });

        
        describe('Performance',()=>{
            it('one cycle in less than 75mus',()=>{
                
                let start = performance.now();
                let n_cycles = 1000;
                for (let i =0 ; i < n_cycles; i++){

                    let te = document.createElement('test-element');
                    // document.body.appendChild(te);
                }
                let te = document.createElement('test-element');
                    document.body.appendChild(te);
                    document.te= te;
                
                let tot  = performance.now() - start;
                chai.assert.isBelow(tot / n_cycles * 1000, 75, "too slow");
            });
        });
    });
}