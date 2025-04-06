const { Inventory, Volume, Series, Listing, ListingInventory } = require('../models');

// Get all inventory items
exports.getAllInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findAll({
      include: [{
        model: Volume,
        as: 'volume',
        include: [{
          model: Series,
          as: 'series'
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    next(error);
  }
};

// Get inventory by status
exports.getInventoryByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    
    const inventory = await Inventory.findAll({
      where: { status },
      include: [{
        model: Volume,
        as: 'volume',
        include: [{
          model: Series,
          as: 'series'
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error(`Error fetching inventory with status ${req.params.status}:`, error);
    next(error);
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [{
        model: Volume,
        as: 'volume',
        include: [{
          model: Series,
          as: 'series'
        }]
      }, {
        model: Listing,
        as: 'listings'
      }]
    });
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    next(error);
  }
};

// Add inventory item
exports.addInventoryItem = async (req, res, next) => {
  try {
    const { volume_id, condition, purchase_price, purchase_date, notes } = req.body;
    
    // Check if volume exists
    const volume = await Volume.findByPk(volume_id, {
      include: [{ model: Series, as: 'series' }]
    });
    
    if (!volume) {
      return res.status(404).json({
        success: false,
        error: 'Volume not found'
      });
    }
    
    // Create inventory item
    const inventoryItem = await Inventory.create({
      volume_id,
      condition,
      purchase_price,
      purchase_date: purchase_date || new Date(),
      notes,
      status: 'in_stock'
    });
    
    // Fetch newly created item with relationships
    const newItem = await Inventory.findByPk(inventoryItem.inventory_id, {
      include: [{
        model: Volume,
        as: 'volume',
        include: [{
          model: Series,
          as: 'series'
        }]
      }]
    });
    
    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    next(error);
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res, next) => {
  try {
    const { condition, purchase_price, purchase_date, notes, status } = req.body;
    
    const inventoryItem = await Inventory.findByPk(req.params.id);
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    // Update inventory item
    await inventoryItem.update({
      condition: condition || inventoryItem.condition,
      purchase_price: purchase_price || inventoryItem.purchase_price,
      purchase_date: purchase_date || inventoryItem.purchase_date,
      notes: notes || inventoryItem.notes,
      status: status || inventoryItem.status
    });
    
    // Fetch updated item with relationships
    const updatedItem = await Inventory.findByPk(inventoryItem.inventory_id, {
      include: [{
        model: Volume,
        as: 'volume',
        include: [{
          model: Series,
          as: 'series'
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    next(error);
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const inventoryItem = await Inventory.findByPk(req.params.id);
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    // Check if inventory item is in any active listings
    const listings = await ListingInventory.findAll({
      where: { inventory_id: req.params.id },
      include: [{
        model: Listing,
        as: 'listing',
        where: { status: 'active' }
      }]
    });
    
    if (listings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete inventory item that is part of an active listing'
      });
    }
    
    await inventoryItem.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    next(error);
  }
};