
import SequelizeDatasource from '../../util/SequelizeDatasource';
import { Sequelize, LOCK, Transaction, Op, Model } from 'sequelize';
import { Product } from '../../models/Product';
import { Tag } from '../../models/Tag';

class ProductsDatasource extends SequelizeDatasource {

  async query(query: any, offset: number, limit: number, order: IOrderByInput[] = []) {
    const subqueries = [];
    const listFormat = (arr: []) => arr.map((str: string) => `"${str}"`).join(',');
    if (Array.isArray(query.productCategories) && query.productCategories.length) {
      subqueries.push({
        [Op.in]: Sequelize.literal(`(
          select product_id
          from products_product_categories
          where product_category_id in (${listFormat(query.productCategories)})
        )`)
      });
    }
    if (Array.isArray(query.makers) && query.makers.length) {
      subqueries.push({
        [Op.in]: Sequelize.literal(`(
          select product_id
          from products_makers
          where maker_id in (${listFormat(query.makers)})
        )`)
      });
    }
    if (Array.isArray(query.tags) && query.tags.length) {
      subqueries.push({
        [Op.in]: Sequelize.literal(`(
          select product_id
          from products_tags
          where tag_id in (${listFormat(query.tags)})
        )`)
      });
    }
    if (Array.isArray(query.youtubeVideos) && query.youtubeVideos.length) {
      subqueries.push({
        [Op.in]: Sequelize.literal(`(
          select product_id
          from products_youtube_videos
          where youtube_video_id in (${listFormat(query.youtubeVideos)})
        )`)
      });
    }
    
    const products = await this.model.findAll({
      include: [{ all: true } ],
      offset,
      limit,
      where: {
        id: {
          [Op.and]: subqueries
        }
      },
      order: order.map(o => [ o.column, o.direction ])
    });
    return products.map(product => this.reduce(<Product>product));
  }

  async onAddBeforeCommit(data: Product, product: Product, transaction: Transaction, lock: LOCK) {
    await product.setTags(data.tags, { transaction, lock });
    await product.setProductCategories(data.productCategories, { transaction, lock });
    await product.setMakers(data.makers, { transaction, lock });
    await product.setYoutubeVideos(data.youtubeVideos, { transaction, lock });
  }

  async onUpdateBeforeCommit(data: Product, product: Product, transaction: Transaction, lock: LOCK) {
    await product.setTags(data.tags, { transaction, lock });
    await product.setProductCategories(data.productCategories, { transaction, lock });
    await product.setMakers(data.makers, { transaction, lock });
    await product.setYoutubeVideos(data.youtubeVideos, { transaction, lock });
  }

  reduce(product: Product) {
    return {
      id: product.get('id'),
      name: product.get('name'),
      productCategories: product.get('productCategories'),
      makers: product.get('Makers'),
      tags: (product.get('Tags') as Tag[]).map(tag => ({
        id: tag.get('id'),
        name: tag.get('name'),
        tagCategory: tag.get('TagCategory')
      })),
      youtubeVideos: product.get('YoutubeVideos'),
      price: product.get('price')
    };
  }

}

module.exports = ProductsDatasource;
