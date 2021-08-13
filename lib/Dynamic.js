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



Dynamic.prototype.getDeepFinalClone = function( ctx , bound ) {
	return Dynamic.getDeepFinalClone( this , ctx , bound ) ;
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



Dynamic.getRecursiveFinalValue =
Dynamic.getDeepFinalValue = function( originalValue , ctx , bound ) {
	var clone , proto , changed = false ,
		value = Dynamic.getFinalValue( originalValue , ctx , bound ) ;

	if (
		! value || typeof value !== 'object'
		// Dynamic value should not be cloned, they always generate unique value at runtime
		|| value.__isDynamic__
	) {
		return value ;
	}

	if ( value !== originalValue ) { changed = true ; }

	if ( Array.isArray( value ) ) {
		clone = value.map( v => {
			let subValue = Dynamic.getDeepFinalValue( v , ctx , bound ) ;
			if ( subValue !== v ) { changed = true ; }
			return subValue ;
		} ) ;

		return changed ? clone : value ;
	}

	// Only clone plain objects
	proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) {
		clone = {} ;
		Object.keys( value ).forEach( k => {
			let subValue = clone[ k ] = Dynamic.getDeepFinalValue( value[ k ] , ctx , bound ) ;
			if ( subValue !== value[ k ] ) { changed = true ; }
		} ) ;

		return changed ? clone : value ;
	}

	return value ;
} ;



// Useful when the data have to be extracted from a tag which is a script, each execution should have its own copy
Dynamic.getDeepFinalClone = function( originalValue , ctx , bound ) {
	var clone , proto ,
		value = Dynamic.getFinalValue( originalValue , ctx , bound ) ;

	if (
		! value || typeof value !== 'object'
		// Dynamic value should not be cloned, they always generate unique value at runtime
		|| value.__isDynamic__
	) {
		return value ;
	}

	// If we already have a unique new value, no need to clone anything: switch to .getDeepFinalValue()
	if ( value !== originalValue ) { Dynamic.getDeepFinalValue( value , ctx , bound ) ; }

	if ( Array.isArray( value ) ) {
		return value.map( v => Dynamic.getDeepFinalClone( v , ctx , bound ) ) ;
	}

	if ( typeof value.clone === 'function' ) { return value.clone() ; }

	// Only clone plain objects
	proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) {
		clone = {} ;
		Object.keys( value ).forEach( k => {
			clone[ k ] = Dynamic.getDeepFinalClone( value[ k ] , ctx , bound ) ;
		} ) ;

		return clone ;
	}

	return value ;
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

