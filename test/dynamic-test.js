/*
	Kung Fig Dynamic
	
	Copyright (c) 2015 - 2018 Cédric Ronvel
	
	The MIT License (MIT)
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

/* jshint unused:false */
/* global describe, it, before, after */

"use strict" ;



var Dynamic = require( '..' ) ;

var expect = require( 'expect.js' ) ;



function deb( v )
{
	console.log( string.inspect( { style: 'color' , depth: 15 } , v ) ) ;
}

function debfn( v )
{
	console.log( string.inspect( { style: 'color' , depth: 5 , proto: true , funcDetails: true } , v ) ) ;
}



function Implement( v , applicable ) {
	this.value = v ;
	this.__isApplicable__ = !! applicable ;
	this.__isDynamic__ = ! applicable ;
	this.getValueCount = 0 ;
	this.applyCount = 0 ;
	this.id = null ;
}

Implement.prototype = Object.create( Dynamic.prototype ) ;

Implement.prototype.get =
Implement.prototype.getValue = function getValue() {
	if ( this.id ) { console.log( ".getValue() for" , this.id ) ; }
	this.getValueCount ++ ;
	if ( ! this.__isDynamic__ ) { return this ; }
	return this.value ;
} ;

Implement.prototype.apply = function apply() {
	if ( this.id ) { console.log( ".apply() for" , this.id ) ; }
	this.applyCount ++ ;
	if ( ! this.__isApplicable__ ) { return this ; }
	return this.value ;
} ;



describe( "Dynamic test" , function() {
	
	it( "Basic dynamic test" , function() {
		var outer = new Implement( "bob" ) ;
		
		expect( outer.getValue() ).to.be( "bob" ) ;
		expect( outer.getFinalValue() ).to.be( "bob" ) ;
		expect( Dynamic.getRecursiveFinalValue( outer ) ).to.be( "bob" ) ;
		
		expect( outer.apply() ).to.be( outer ) ;
	} ) ;
	
	it( "Basic applicable test" , function() {
		var outer = new Implement( "bob" , true ) ;
		
		expect( outer.getValue() ).to.be( outer ) ;
		expect( outer.getFinalValue() ).to.be( outer ) ;
		expect( Dynamic.getRecursiveFinalValue( outer ) ).to.be( outer ) ;
		
		expect( outer.apply() ).to.be( "bob" ) ;
	} ) ;
	
	it( "Recursive dynamic/dynamic test" , function() {
		var inner = new Implement( "bob" ) ;
		var outer = new Implement( inner ) ;
		
		expect( outer.getValue() ).to.be( inner ) ;
		expect( outer.getValue().getValue() ).to.be( "bob" ) ;
		expect( outer.getFinalValue() ).to.be( "bob" ) ;
		expect( Dynamic.getRecursiveFinalValue( outer ) ).to.be( "bob" ) ;
		
		expect( outer.apply() ).to.be( outer ) ;
	} ) ;
	
	it( "Recursive applicable/dynamic test" , function() {
		var inner = new Implement( "bob" ) ;
		var outer = new Implement( inner , true ) ;
		
		expect( outer.getValue() ).to.be( outer ) ;
		expect( outer.getFinalValue() ).to.be( outer ) ;
		expect( Dynamic.getRecursiveFinalValue( outer ) ).to.be( outer ) ;
		
		expect( outer.apply() ).to.be( inner ) ;
		expect( outer.apply().getValue() ).to.be( "bob" ) ;
	} ) ;
	
	it( "Recursive dynamic/applicable test" , function() {
		var inner = new Implement( "bob" , true ) ;
		var outer = new Implement( inner ) ;
		
		expect( outer.getValue() ).to.be( inner ) ;
		expect( outer.getValue().getValue() ).to.be( inner ) ;
		expect( outer.getValue().apply() ).to.be( "bob" ) ;
		expect( outer.getFinalValue() ).to.be( inner ) ;
		expect( Dynamic.getRecursiveFinalValue( outer ) ).to.be( inner ) ;
		
		expect( outer.apply() ).to.be( outer ) ;
	} ) ;
	
	it( "Recursive applicable/applicable test" , function() {
		var inner = new Implement( "bob" , true ) ;
		var outer = new Implement( inner , true ) ;
		
		expect( outer.getValue() ).to.be( outer ) ;
		expect( outer.getFinalValue() ).to.be( outer ) ;
		expect( Dynamic.getRecursiveFinalValue( outer ) ).to.be( outer ) ;
		
		expect( outer.apply() ).to.be( inner ) ;
		expect( outer.apply().getValue() ).to.be( inner ) ;
		expect( outer.apply().apply() ).to.be( "bob" ) ;
	} ) ;
	
	it( ".getRecursiveFinalValue()" , function() {
		var inner = new Implement( "bob" ) ;
		var middle = new Implement( inner , true ) ;
		var outer = new Implement( middle ) ;
		
		inner.id = "inner" ;
		middle.id = "middle" ;
		outer.id = "outer" ;
		
		var value = Dynamic.getRecursiveFinalValue( outer ) ;
		
		expect( outer.getValueCount ).to.be( 1 ) ;
		expect( middle.getValueCount ).to.be( 0 ) ;
		expect( inner.getValueCount ).to.be( 0 ) ;
	} ) ;
} ) ;


