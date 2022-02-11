/*
	Kung Fig Dynamic

	Copyright (c) 2015 - 2021 Cédric Ronvel

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

"use strict" ;



function Dynamic() { throw new Error( 'Dynamic should be derived' ) ; }
module.exports = Dynamic ;

Dynamic.prototype.__prototypeUID__ = 'kung-fig/Dynamic' ;
Dynamic.prototype.__prototypeVersion__ = require( '../package.json' ).version ;

// It is either dynamic or applicable, but not both
Dynamic.prototype.__isDynamic__ = true ;
Dynamic.prototype.__isApplicable__ = false ;



Dynamic.prototype.getValue = Dynamic.prototype.get = function( /* ctx , bound */ ) { throw new Error( 'Dynamic#get() / Dynamic#getValue() should be overloaded' ) ; } ;
Dynamic.prototype.set = function( /* ctx , v */ ) { throw new Error( 'Dynamic#set() should be overloaded' ) ; } ;
Dynamic.prototype.apply = function( /* ctx , bound */ ) { throw new Error( 'Dynamic#apply() should be overloaded' ) ; } ;



Dynamic.prototype.toString = function( ctx ) {
	return '' + this.getFinalValue( ctx ) ;
} ;



Dynamic.prototype.getFinalValue = function( ctx , bound ) {
	var value = this ;

	while ( value && typeof value === 'object' && value.__isDynamic__ ) {
		value = value.getValue( ctx , bound ) ;
	}

	return value ;
} ;



Dynamic.prototype.getRecursiveFinalValue =
Dynamic.prototype.getDeepFinalValue = function( ctx , bound ) {
	return Dynamic.getDeepFinalValue( this , ctx , bound ) ;
} ;



Dynamic.prototype.extractFromStatic = function( ctx , bound ) {
	return Dynamic.extractFromStatic( this , ctx , bound ) ;
} ;



Dynamic.get = Dynamic.getValue = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isDynamic__ ) { return value.getValue( ctx , bound ) ; }
	return value ;
} ;



Dynamic.apply = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isApplicable__ ) { return value.apply( ctx , bound ) ; }
	return value ;
} ;



Dynamic.getFinalValue = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isDynamic__ ) { return value.getFinalValue( ctx , bound ) ; }
	return value ;
} ;



const OBJECTS_SEEN = new Set() ;

// Same than Dynamic.getDeepFinalValue() but check for circular dependencies
Dynamic.getSafeFinalValue = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isDynamic__ ) {
		if ( OBJECTS_SEEN.has( value ) ) { return undefined ; }
		OBJECTS_SEEN.add( value ) ;
		let newValue = value.getFinalValue( ctx , bound ) ;
		OBJECTS_SEEN.delete( value ) ;
		return newValue ;
	}

	return value ;
} ;



// Return true if the value constains dynamics at any depth, and thus should be cloned
Dynamic.isDeepDynamic = function( value ) {
	if ( ! value || typeof value !== 'object' ) { return false ; }
	if ( value.__isDynamic__ ) { return true ; }

	if ( Array.isArray( value ) ) {
		return value.some( e => Dynamic.isDeepDynamic( e ) ) ;
	}

	// Only clone plain objects
	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) {
		return Object.keys( value ).some( k => Dynamic.isDeepDynamic( value[ k ] ) ) ;
	}

	return false ;
} ;



Dynamic.getRecursiveFinalValue =
Dynamic.getDeepFinalValue = function( originalValue , ctx , bound , fromStatic = false ) {
	var clone , proto ,
		value = Dynamic.getFinalValue( originalValue , ctx , bound ) ;

	// After Dynamic.getFinalValue(), value can't be dynamic anymore

	// The value returned by .getFinalValue(), even if it's an object, should not be deep-inspected,
	// it is the responsibility of the instance's .getFinalValue() to call Dynamic.getDeepFinalValue()
	// all by itself if it needs to resolve further more.
	if ( ! value || typeof value !== 'object' || value !== originalValue ) { return value ; }

	// If there is no dynamic, there is no need to clone anything
	if ( ! fromStatic && ! Dynamic.isDeepDynamic( value ) ) { return value ; }

	// Here we have to clone, because there are some dynamics

	if ( Array.isArray( value ) ) {
		return value.map( v => Dynamic.getDeepFinalValue( v , ctx , bound , fromStatic ) ) ;
	}

	if ( fromStatic && typeof value.clone === 'function' ) { return value.clone() ; }

	// Only clone plain objects
	proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) {
		clone = {} ;
		Object.keys( value ).forEach( k => {
			clone[ k ] = Dynamic.getDeepFinalValue( value[ k ] , ctx , bound , fromStatic ) ;
		} ) ;

		return clone ;
	}

	return value ;
} ;



// Extract the value from the parsed script, all non-immutable objects have to be cloned, because a unique uncorrelated value
// could be extracted multiple times from the same “static script template” (e.g.: static script data inside a loop or a function).
Dynamic.extractFromStatic = function( originalValue , ctx , bound ) {
	return Dynamic.getDeepFinalValue( originalValue , ctx , bound , true ) ;
} ;



// For the record, until the transition is successful
Dynamic.prototype.getRecursiveFinalValue_old = function( ctx , bound ) {
	return Dynamic.getRecursiveFinalValue_old( this , ctx , bound ) ;
} ;

Dynamic.getRecursiveFinalValue_old = function( value , ctx , bound , clone1stGen ) {
	var k , copy , proto , originalValue = value , changed = false ;

	value = Dynamic.getFinalValue( value , ctx , bound ) ;

	// It should not be needed to check dynamic/applicable, since they shouldn't have the Object/null proto
	//if ( value && typeof value === 'object' && ! value.__isDynamic__ && ! value.__isApplicable__ ) {
	if ( value && typeof value === 'object' ) {
		copy = value ;

		proto = Object.getPrototypeOf( value ) ;

		if ( Array.isArray( value ) ) {
			if ( originalValue === value ) { copy = [] ; }

			value.forEach( ( v , i ) => {
				copy[ i ] = Dynamic.getRecursiveFinalValue_old( value[ i ] , ctx , bound , originalValue === value && clone1stGen ) ;
				changed = changed || copy[ i ] !== value[ i ] ;
			} ) ;
		}
		// Only clone plain objects
		else if ( proto === Object.prototype || proto === null ) {
			if ( originalValue === value ) { copy = {} ; }

			// 'for in' because we DO want to patch non-owned properties as well
			for ( k in value ) {
				copy[ k ] = Dynamic.getRecursiveFinalValue_old( value[ k ] , ctx , bound , originalValue === value && clone1stGen ) ;
				changed = changed || copy[ k ] !== value[ k ] ;
			}
		}

		// Do not use the copy if it is identical to the value
		if ( changed || clone1stGen ) { value = copy ; }
		//value = copy ;
	}

	return value ;
} ;

