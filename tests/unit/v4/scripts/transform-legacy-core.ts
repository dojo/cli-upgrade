const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

import * as os from 'os';

let jscodeshift = require('jscodeshift');
import moduleTransform from '../../../../src/v4/scripts/transform-legacy-core';

jscodeshift = jscodeshift.withParser('ts');

describe('transform-legacy-core', () => {
	it('should transform legacy package imports to local copies', () => {
		/**
		 * Source from {@link https://github.com/dojo/framework/blob/v3.0.1/src/core/request.ts @dojo/framework/core/request.ts}
		 */
		const input = {
			source: `
import has from '../has/has';
import Task from './async/Task';
import { RequestOptions, Response, Provider, UploadObservableTask } from './request/interfaces';
import ProviderRegistry from './request/ProviderRegistry';
import xhr from './request/providers/xhr';

export const providerRegistry = new ProviderRegistry();

const request: {
    (url: string, options?: RequestOptions): Task<Response>;
    delete(url: string, options?: RequestOptions): Task<Response>;
    get(url: string, options?: RequestOptions): Task<Response>;
    head(url: string, options?: RequestOptions): Task<Response>;
    options(url: string, options?: RequestOptions): Task<Response>;
    post(url: string, options?: RequestOptions): UploadObservableTask<Response>;
    put(url: string, options?: RequestOptions): UploadObservableTask<Response>;

    setDefaultProvider(provider: Provider): void;
} = function request(url: string, options: RequestOptions = {}): Task<Response> {
    try {
        return providerRegistry.match(url, options)(url, options);
    } catch (error) {
        return Task.reject<Response>(error);
    }
} as any;

['DELETE', 'GET', 'HEAD', 'OPTIONS'].forEach((method) => {
    Object.defineProperty(request, method.toLowerCase(), {
        value(url: string, options: RequestOptions = {}): Task<Response> {
            options = Object.create(options);
            options.method = method;
            return request(url, options);
        }
    });
});

['POST', 'PUT'].forEach((method) => {
    Object.defineProperty(request, method.toLowerCase(), {
        value(url: string, options: RequestOptions = {}): UploadObservableTask<Response> {
            options = Object.create(options);
            options.method = method;
            return request(url, options) as UploadObservableTask<Response>;
        }
    });
});

Object.defineProperty(request, 'setDefaultProvider', {
    value(provider: Provider) {
        providerRegistry.setDefaultProvider(provider);
    }
});

providerRegistry.setDefaultProvider(xhr);

if (has('host-node')) {
    // tslint:disable-next-line
    import('./request/providers/node').then((node) => {
        providerRegistry.setDefaultProvider(node.default);
    });
}

export default request;
export * from './request/interfaces';
export { default as Headers } from './request/Headers';
export { default as TimeoutError } from './request/TimeoutError';
export { ResponseData } from './request/Response';
`
		};

		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			`
import has from '@dojo/framework/has/has';
import Task from './async/Task';
import { RequestOptions, Response, Provider, UploadObservableTask } from './request/interfaces';
import ProviderRegistry from './request/ProviderRegistry';
import xhr from './request/providers/xhr';

export const providerRegistry = new ProviderRegistry();

const request: {
    (url: string, options?: RequestOptions): Task<Response>;
    delete(url: string, options?: RequestOptions): Task<Response>;
    get(url: string, options?: RequestOptions): Task<Response>;
    head(url: string, options?: RequestOptions): Task<Response>;
    options(url: string, options?: RequestOptions): Task<Response>;
    post(url: string, options?: RequestOptions): UploadObservableTask<Response>;
    put(url: string, options?: RequestOptions): UploadObservableTask<Response>;

    setDefaultProvider(provider: Provider): void;
} = function request(url: string, options: RequestOptions = {}): Task<Response> {
    try {
        return providerRegistry.match(url, options)(url, options);
    } catch (error) {
        return Task.reject<Response>(error);
    }
} as any;

['DELETE', 'GET', 'HEAD', 'OPTIONS'].forEach((method) => {
    Object.defineProperty(request, method.toLowerCase(), {
        value(url: string, options: RequestOptions = {}): Task<Response> {
            options = Object.create(options);
            options.method = method;
            return request(url, options);
        }
    });
});

['POST', 'PUT'].forEach((method) => {
    Object.defineProperty(request, method.toLowerCase(), {
        value(url: string, options: RequestOptions = {}): UploadObservableTask<Response> {
            options = Object.create(options);
            options.method = method;
            return request(url, options) as UploadObservableTask<Response>;
        }
    });
});

Object.defineProperty(request, 'setDefaultProvider', {
    value(provider: Provider) {
        providerRegistry.setDefaultProvider(provider);
    }
});

providerRegistry.setDefaultProvider(xhr);

if (has('host-node')) {
    // tslint:disable-next-line
    import('./request/providers/node').then((node) => {
        providerRegistry.setDefaultProvider(node.default);
    });
}

export default request;
export * from './request/interfaces';
export { default as Headers } from './request/Headers';
export { default as TimeoutError } from './request/TimeoutError';
export { ResponseData } from './request/Response';
`
				.split(/\r?\n/g)
				.join(os.EOL)
		);
	});

	it('should convert "export *" syntax paths', () => {
		/**
		 * Source from {@link https://github.com/dojo/framework/blob/v3.0.1/src/core/queue.ts @dojo/framework/core/queue.ts}
		 */
		const input = {
			source: `
export * from '../shim/support/queue';
`
		};

		const output = moduleTransform(input, { jscodeshift, stats: () => {} });
		assert.equal(
			output,
			`
export * from '@dojo/framework/shim/support/queue';
`
				.split(/\r?\n/g)
				.join(os.EOL)
		);
	});
});
